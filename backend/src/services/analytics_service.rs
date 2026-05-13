use std::collections::BTreeMap;
use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::config::Config;
use crate::error::{AppError, AppResult};
use crate::models::tutor::{ContactsRevealed, TutorProfile};
use crate::utils::contact_links::{build_contact_links, ContactLinks};
use crate::utils::contacts::build_revealed;
use crate::utils::ip::hash_ip;

const VIEW_DEDUP_MINUTES: i64 = 5;
const CLICK_COUNTER_DEDUP_MINUTES: i64 = 60;

#[derive(Debug, Copy, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ContactChannel {
    Phone,
    Whatsapp,
    Telegram,
    Email,
    Instagram,
}

impl ContactChannel {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Phone => "phone",
            Self::Whatsapp => "whatsapp",
            Self::Telegram => "telegram",
            Self::Email => "email",
            Self::Instagram => "instagram",
        }
    }
}

#[derive(Debug, Copy, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Period {
    Week,
    Month,
    All,
}

impl Period {
    pub fn from_query(s: Option<&str>) -> Self {
        match s {
            Some("week") => Self::Week,
            Some("all") => Self::All,
            _ => Self::Month,
        }
    }

    fn days(&self) -> Option<i64> {
        match self {
            Self::Week => Some(7),
            Self::Month => Some(30),
            Self::All => None,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct PeriodQuery {
    pub period: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MetricBlock {
    pub total: i64,
    pub current_period: i64,
    pub previous_period: i64,
    pub change_percent: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ConversionBlock {
    pub current_period: f64,
    pub previous_period: f64,
    pub change_percent: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct CurrentPosition {
    pub subject: Option<String>,
    pub city: Option<String>,
    pub rank: Option<i64>,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct OverviewResponse {
    pub views: MetricBlock,
    pub contact_clicks: MetricBlock,
    pub conversion: ConversionBlock,
    pub current_position: CurrentPosition,
}

#[derive(Debug, Serialize)]
pub struct DayCount {
    pub date: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct ChannelStat {
    pub channel: String,
    pub count: i64,
    pub percent: f64,
}

#[derive(Debug, Serialize)]
pub struct ContactClicksResponse {
    pub by_channel: Vec<ChannelStat>,
    pub by_day: Vec<DayCount>,
}

#[derive(Debug, Serialize)]
pub struct SourceStat {
    pub source: String,
    pub count: i64,
    pub percent: f64,
}

#[derive(Debug, Serialize)]
pub struct SourcesResponse {
    pub sources: Vec<SourceStat>,
}

#[derive(Debug, Serialize)]
pub struct AnalyticsEvent {
    pub r#type: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ChecklistItem {
    pub id: String,
    pub label: String,
    pub completed: bool,
}

#[derive(Debug, Serialize)]
pub struct ProfileCompleteness {
    pub percent: i32,
    pub checklist: Vec<ChecklistItem>,
}

#[derive(Debug, Serialize)]
pub struct DashboardResponse {
    pub overview: OverviewResponse,
    pub views_chart: Vec<DayCount>,
    pub contacts_by_channel: Vec<ChannelStat>,
    pub sources: Vec<SourceStat>,
    pub recent_events: Vec<AnalyticsEvent>,
    pub verification_status: String,
    pub rejection_reason: Option<String>,
    pub profile_completeness: ProfileCompleteness,
}

#[derive(Debug, Serialize)]
pub struct RevealContactsResponse {
    #[serde(flatten)]
    pub contacts: ContactsRevealed,
    pub links: ContactLinks,
}

pub struct AnalyticsService {
    pub pool: PgPool,
    pub config: Arc<Config>,
}

impl AnalyticsService {
    pub fn new(pool: PgPool, config: Arc<Config>) -> Self {
        Self { pool, config }
    }

    pub async fn reveal_contacts(
        &self,
        slug: &str,
        user_id: Option<Uuid>,
        ip: Option<&str>,
        user_agent: Option<String>,
        referrer: Option<String>,
    ) -> AppResult<RevealContactsResponse> {
        let profile: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "SELECT * FROM tutor_profiles \
             WHERE slug = $1 AND status = 'active' AND verified = TRUE",
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;

        let ip_h = ip.map(|i| hash_ip(i, &self.config.ip_hash_salt));

        // dedup: same IP within 5 min for same tutor → don't re-record
        let already: Option<(i64,)> = if let Some(ip_h) = ip_h.as_deref() {
            sqlx::query_as(
                "SELECT COUNT(*) FROM tutor_views \
                 WHERE tutor_id = $1 AND ip_hash = $2 AND created_at > NOW() - ($3 || ' minutes')::INTERVAL",
            )
            .bind(profile.id)
            .bind(ip_h)
            .bind(VIEW_DEDUP_MINUTES.to_string())
            .fetch_optional(&self.pool)
            .await?
        } else {
            None
        };
        let is_new = already.map(|(c,)| c == 0).unwrap_or(true);

        if is_new {
            let pool = self.pool.clone();
            let tutor_id = profile.id;
            let ip_h = ip_h.clone();
            tokio::spawn(async move {
                let _ = sqlx::query(
                    "INSERT INTO tutor_views (tutor_id, user_id, ip_hash, user_agent, referrer) \
                     VALUES ($1, $2, $3, $4, $5)",
                )
                .bind(tutor_id)
                .bind(user_id)
                .bind(ip_h)
                .bind(user_agent)
                .bind(referrer)
                .execute(&pool)
                .await;
                let _ = sqlx::query(
                    "UPDATE tutor_profiles SET views_count = views_count + 1 WHERE id = $1",
                )
                .bind(tutor_id)
                .execute(&pool)
                .await;
            });
        }

        let revealed = build_revealed(&profile);
        let links = build_contact_links(&revealed);
        Ok(RevealContactsResponse {
            contacts: revealed,
            links,
        })
    }

    pub async fn record_contact_click(
        &self,
        slug: &str,
        channel: ContactChannel,
        user_id: Option<Uuid>,
        ip: Option<&str>,
        referrer: Option<String>,
    ) -> AppResult<()> {
        let row: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM tutor_profiles \
             WHERE slug = $1 AND status = 'active' AND verified = TRUE",
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?;
        let (tutor_id,) = row.ok_or(AppError::NotFound)?;
        let channel_str = channel.as_str();
        let ip_h = ip.map(|i| hash_ip(i, &self.config.ip_hash_salt));

        // counter dedup: 60 min window per (tutor, channel, ip)
        let counter_dup: Option<(i64,)> = if let Some(ip_h) = ip_h.as_deref() {
            sqlx::query_as(
                "SELECT COUNT(*) FROM tutor_contact_clicks \
                 WHERE tutor_id = $1 AND channel = $2 AND ip_hash = $3 \
                   AND created_at > NOW() - ($4 || ' minutes')::INTERVAL",
            )
            .bind(tutor_id)
            .bind(channel_str)
            .bind(ip_h)
            .bind(CLICK_COUNTER_DEDUP_MINUTES.to_string())
            .fetch_optional(&self.pool)
            .await?
        } else {
            None
        };
        let increment_counter = counter_dup.map(|(c,)| c == 0).unwrap_or(true);

        let pool = self.pool.clone();
        let ip_h_owned = ip_h.clone();
        tokio::spawn(async move {
            let _ = sqlx::query(
                "INSERT INTO tutor_contact_clicks (tutor_id, channel, user_id, ip_hash, referrer) \
                 VALUES ($1, $2, $3, $4, $5)",
            )
            .bind(tutor_id)
            .bind(channel_str)
            .bind(user_id)
            .bind(ip_h_owned)
            .bind(referrer)
            .execute(&pool)
            .await;
            if increment_counter {
                let _ = sqlx::query(
                    "UPDATE tutor_profiles SET contact_clicks_count = contact_clicks_count + 1 \
                     WHERE id = $1",
                )
                .bind(tutor_id)
                .execute(&pool)
                .await;
            }
        });

        Ok(())
    }

    pub async fn overview(&self, user_id: Uuid, period: Period) -> AppResult<OverviewResponse> {
        let tutor = self.must_get_tutor(user_id).await?;
        let now = Utc::now();
        let (cur_from, prev_from) = match period.days() {
            Some(d) => (
                Some(now - Duration::days(d)),
                Some(now - Duration::days(d * 2)),
            ),
            None => (None, None),
        };

        let total_views: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM tutor_views WHERE tutor_id = $1")
                .bind(tutor.id)
                .fetch_one(&self.pool)
                .await?;

        let cur_views = self
            .count_in_window("tutor_views", tutor.id, cur_from, Some(now))
            .await?;
        let prev_views = self
            .count_in_window("tutor_views", tutor.id, prev_from, cur_from)
            .await?;

        let total_clicks: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM tutor_contact_clicks WHERE tutor_id = $1")
                .bind(tutor.id)
                .fetch_one(&self.pool)
                .await?;

        let cur_clicks = self
            .count_in_window("tutor_contact_clicks", tutor.id, cur_from, Some(now))
            .await?;
        let prev_clicks = self
            .count_in_window("tutor_contact_clicks", tutor.id, prev_from, cur_from)
            .await?;

        let conv_cur = ratio_percent(cur_clicks, cur_views);
        let conv_prev = ratio_percent(prev_clicks, prev_views);

        let position = self.compute_position(&tutor).await?;

        Ok(OverviewResponse {
            views: MetricBlock {
                total: total_views.0,
                current_period: cur_views,
                previous_period: prev_views,
                change_percent: change_percent(cur_views, prev_views),
            },
            contact_clicks: MetricBlock {
                total: total_clicks.0,
                current_period: cur_clicks,
                previous_period: prev_clicks,
                change_percent: change_percent(cur_clicks, prev_clicks),
            },
            conversion: ConversionBlock {
                current_period: round1(conv_cur),
                previous_period: round1(conv_prev),
                change_percent: change_percent_f64(conv_cur, conv_prev),
            },
            current_position: position,
        })
    }

    pub async fn views_by_day(&self, user_id: Uuid, period: Period) -> AppResult<Vec<DayCount>> {
        let tutor = self.must_get_tutor(user_id).await?;
        let days = period.days().unwrap_or(30);
        self.daily_counts("tutor_views", tutor.id, days).await
    }

    pub async fn contact_clicks(
        &self,
        user_id: Uuid,
        period: Period,
    ) -> AppResult<ContactClicksResponse> {
        let tutor = self.must_get_tutor(user_id).await?;
        let days = period.days().unwrap_or(30);
        let from = Utc::now() - Duration::days(days);

        let rows: Vec<(String, i64)> = sqlx::query_as(
            "SELECT channel, COUNT(*) FROM tutor_contact_clicks \
             WHERE tutor_id = $1 AND created_at >= $2 \
             GROUP BY channel ORDER BY COUNT(*) DESC",
        )
        .bind(tutor.id)
        .bind(from)
        .fetch_all(&self.pool)
        .await?;
        let total: i64 = rows.iter().map(|r| r.1).sum();
        let by_channel = rows
            .into_iter()
            .map(|(channel, count)| ChannelStat {
                channel,
                count,
                percent: round1(ratio_percent(count, total)),
            })
            .collect();

        let by_day = self.daily_counts("tutor_contact_clicks", tutor.id, days).await?;
        Ok(ContactClicksResponse { by_channel, by_day })
    }

    pub async fn sources(&self, user_id: Uuid, period: Period) -> AppResult<SourcesResponse> {
        let tutor = self.must_get_tutor(user_id).await?;
        let days = period.days().unwrap_or(30);
        let from = Utc::now() - Duration::days(days);

        let rows: Vec<(Option<String>,)> = sqlx::query_as(
            "SELECT referrer FROM tutor_views WHERE tutor_id = $1 AND created_at >= $2",
        )
        .bind(tutor.id)
        .bind(from)
        .fetch_all(&self.pool)
        .await?;

        let mut counts: BTreeMap<&'static str, i64> = BTreeMap::new();
        for (referrer,) in &rows {
            let key = classify_source(referrer.as_deref());
            *counts.entry(key).or_insert(0) += 1;
        }
        let total: i64 = counts.values().sum();
        let mut sources: Vec<SourceStat> = counts
            .into_iter()
            .map(|(k, c)| SourceStat {
                source: k.to_string(),
                count: c,
                percent: round1(ratio_percent(c, total)),
            })
            .collect();
        sources.sort_by(|a, b| b.count.cmp(&a.count));
        Ok(SourcesResponse { sources })
    }

    pub async fn recent_events(&self, user_id: Uuid) -> AppResult<Vec<AnalyticsEvent>> {
        let tutor = self.must_get_tutor(user_id).await?;
        let now = Utc::now();
        let week_ago = now - Duration::days(7);
        let mut events: Vec<AnalyticsEvent> = Vec::new();

        let views_week: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM tutor_views WHERE tutor_id = $1 AND created_at >= $2",
        )
        .bind(tutor.id)
        .bind(week_ago)
        .fetch_one(&self.pool)
        .await?;
        if views_week.0 > 0 {
            events.push(AnalyticsEvent {
                r#type: "views_milestone".into(),
                message: format!(
                    "{} человек посмотрели ваш профиль на этой неделе",
                    views_week.0
                ),
                timestamp: now,
            });
        }

        let pos = self.compute_position(&tutor).await?;
        if let (Some(rank), Some(subject), Some(city)) = (pos.rank, pos.subject, pos.city) {
            events.push(AnalyticsEvent {
                r#type: "rank_position".into(),
                message: format!(
                    "Ваш профиль на {}-м месте в категории «{} в {}»",
                    rank, subject, city
                ),
                timestamp: now,
            });
        }

        let clicks: Vec<(String, i64)> = sqlx::query_as(
            "SELECT channel, COUNT(*) FROM tutor_contact_clicks \
             WHERE tutor_id = $1 AND created_at >= $2 \
             GROUP BY channel ORDER BY COUNT(*) DESC LIMIT 1",
        )
        .bind(tutor.id)
        .bind(week_ago)
        .fetch_all(&self.pool)
        .await?;
        if let Some((channel, count)) = clicks.into_iter().next() {
            events.push(AnalyticsEvent {
                r#type: "contact_click".into(),
                message: format!("{} кликов по {} за неделю", count, channel),
                timestamp: now,
            });
        }

        Ok(events)
    }

    pub async fn dashboard(&self, user_id: Uuid) -> AppResult<DashboardResponse> {
        let tutor = self.must_get_tutor(user_id).await?;
        let overview = self.overview(user_id, Period::Month).await?;
        let views_chart = self.views_by_day(user_id, Period::Month).await?;
        let clicks = self.contact_clicks(user_id, Period::Month).await?;
        let sources = self.sources(user_id, Period::Month).await?;
        let events = self.recent_events(user_id).await?;
        let edu_count: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM tutor_education WHERE tutor_id = $1")
                .bind(tutor.id)
                .fetch_one(&self.pool)
                .await?;
        let completeness = calc_completeness(&tutor, edu_count.0);
        Ok(DashboardResponse {
            overview,
            views_chart,
            contacts_by_channel: clicks.by_channel,
            sources: sources.sources,
            recent_events: events,
            verification_status: tutor.status.clone(),
            rejection_reason: tutor.rejection_reason.clone(),
            profile_completeness: completeness,
        })
    }

    async fn must_get_tutor(&self, user_id: Uuid) -> AppResult<TutorProfile> {
        sqlx::query_as::<_, TutorProfile>("SELECT * FROM tutor_profiles WHERE user_id = $1")
            .bind(user_id)
            .fetch_optional(&self.pool)
            .await?
            .ok_or(AppError::NotFound)
    }

    async fn count_in_window(
        &self,
        table: &str,
        tutor_id: Uuid,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> AppResult<i64> {
        // table is whitelisted to avoid SQL injection
        let table = match table {
            "tutor_views" => "tutor_views",
            "tutor_contact_clicks" => "tutor_contact_clicks",
            _ => return Err(AppError::Internal("invalid analytics table".into())),
        };
        let sql = format!(
            "SELECT COUNT(*) FROM {table} WHERE tutor_id = $1 \
             AND ($2::TIMESTAMPTZ IS NULL OR created_at >= $2) \
             AND ($3::TIMESTAMPTZ IS NULL OR created_at < $3)"
        );
        let row: (i64,) = sqlx::query_as(&sql)
            .bind(tutor_id)
            .bind(from)
            .bind(to)
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    async fn daily_counts(
        &self,
        table: &str,
        tutor_id: Uuid,
        days: i64,
    ) -> AppResult<Vec<DayCount>> {
        let table = match table {
            "tutor_views" => "tutor_views",
            "tutor_contact_clicks" => "tutor_contact_clicks",
            _ => return Err(AppError::Internal("invalid analytics table".into())),
        };
        let from = (Utc::now() - Duration::days(days - 1)).date_naive();
        let sql = format!(
            "SELECT TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS d, COUNT(*) AS c \
             FROM {table} WHERE tutor_id = $1 AND created_at >= $2 \
             GROUP BY DATE(created_at) ORDER BY DATE(created_at)"
        );
        let rows: Vec<(String, i64)> = sqlx::query_as(&sql)
            .bind(tutor_id)
            .bind(from)
            .fetch_all(&self.pool)
            .await?;

        let mut by_date: BTreeMap<String, i64> =
            rows.into_iter().collect();

        let mut out: Vec<DayCount> = Vec::with_capacity(days as usize);
        for i in 0..days {
            let d = (Utc::now() - Duration::days(days - 1 - i))
                .date_naive()
                .format("%Y-%m-%d")
                .to_string();
            let count = by_date.remove(&d).unwrap_or(0);
            out.push(DayCount { date: d, count });
        }
        Ok(out)
    }

    async fn compute_position(&self, tutor: &TutorProfile) -> AppResult<CurrentPosition> {
        // primary subject id + name
        let subj: Option<(Uuid, String)> = sqlx::query_as(
            "SELECT s.id, s.name_ru FROM subjects s \
             JOIN tutor_subjects ts ON ts.subject_id = s.id \
             WHERE ts.tutor_id = $1 \
             ORDER BY s.sort_order LIMIT 1",
        )
        .bind(tutor.id)
        .fetch_optional(&self.pool)
        .await?;

        let city: Option<(Uuid, String)> = if let Some(city_id) = tutor.city_id {
            sqlx::query_as("SELECT id, name_ru FROM cities WHERE id = $1")
                .bind(city_id)
                .fetch_optional(&self.pool)
                .await?
        } else {
            None
        };

        let (Some((subject_id, subject_name)), Some((city_id, city_name))) = (subj, city) else {
            return Ok(CurrentPosition {
                subject: None,
                city: None,
                rank: None,
                total: 0,
            });
        };

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM tutor_profiles tp \
             JOIN tutor_subjects ts ON ts.tutor_id = tp.id \
             WHERE tp.status = 'active' AND tp.verified = TRUE \
               AND tp.city_id = $1 AND ts.subject_id = $2",
        )
        .bind(city_id)
        .bind(subject_id)
        .fetch_one(&self.pool)
        .await?;

        let better: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM tutor_profiles tp \
             JOIN tutor_subjects ts ON ts.tutor_id = tp.id \
             WHERE tp.status = 'active' AND tp.verified = TRUE \
               AND tp.city_id = $1 AND ts.subject_id = $2 \
               AND ( \
                  COALESCE(tp.rating, 0) > COALESCE($3, 0) \
                  OR (COALESCE(tp.rating, 0) = COALESCE($3, 0) AND tp.views_count > $4) \
                  OR (COALESCE(tp.rating, 0) = COALESCE($3, 0) AND tp.views_count = $4 AND tp.id < $5) \
               )",
        )
        .bind(city_id)
        .bind(subject_id)
        .bind(tutor.rating)
        .bind(tutor.views_count)
        .bind(tutor.id)
        .fetch_one(&self.pool)
        .await?;

        Ok(CurrentPosition {
            subject: Some(subject_name),
            city: Some(city_name),
            rank: Some(better.0 + 1),
            total: total.0,
        })
    }
}

fn ratio_percent(num: i64, denom: i64) -> f64 {
    if denom == 0 {
        0.0
    } else {
        num as f64 / denom as f64 * 100.0
    }
}

fn change_percent(cur: i64, prev: i64) -> Option<f64> {
    if prev == 0 {
        if cur == 0 {
            Some(0.0)
        } else {
            None
        }
    } else {
        Some(round1((cur - prev) as f64 / prev as f64 * 100.0))
    }
}

fn change_percent_f64(cur: f64, prev: f64) -> Option<f64> {
    if prev == 0.0 {
        if cur == 0.0 {
            Some(0.0)
        } else {
            None
        }
    } else {
        Some(round1((cur - prev) / prev * 100.0))
    }
}

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

fn classify_source(referrer: Option<&str>) -> &'static str {
    let Some(r) = referrer else {
        return "direct";
    };
    let r = r.to_lowercase();
    if r.contains("google.") {
        return "google";
    }
    if r.contains("yandex.") {
        return "yandex";
    }
    if r.contains("instagram.com") {
        return "instagram";
    }
    if r.contains("/blog/") {
        return "blog";
    }
    if r.contains("/exam/") || r.contains("/subject/") {
        return "seo_landing";
    }
    if r.contains("repka.kg") {
        return "catalog";
    }
    "other"
}

pub fn calc_completeness(tutor: &TutorProfile, education_count: i64) -> ProfileCompleteness {
    let bio_ok = tutor
        .bio
        .as_ref()
        .map(|b| b.chars().count() >= 100)
        .unwrap_or(false);
    let contacts_ok = tutor.contact_phone.is_some()
        || tutor.contact_whatsapp.is_some()
        || tutor.contact_telegram.is_some();
    let checks: Vec<(&str, &str, bool)> = vec![
        ("photo", "Загрузить фото", tutor.photo_url.is_some()),
        (
            "video",
            "Загрузить видео-визитку",
            tutor.video_url.is_some(),
        ),
        ("bio", "Заполнить описание", bio_ok),
        ("education", "Указать образование", education_count > 0),
        ("prices", "Указать цены", tutor.price_per_60.is_some()),
        ("contacts", "Добавить контакты", contacts_ok),
    ];
    let total = checks.len() as f64;
    let completed = checks.iter().filter(|(_, _, c)| *c).count() as f64;
    let percent = (completed / total * 100.0).round() as i32;
    ProfileCompleteness {
        percent,
        checklist: checks
            .into_iter()
            .map(|(id, label, completed)| ChecklistItem {
                id: id.into(),
                label: label.into(),
                completed,
            })
            .collect(),
    }
}
