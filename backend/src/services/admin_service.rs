use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::auth::password::hash_password;
use crate::config::Config;
use crate::error::{AppError, AppResult};

pub struct AdminService {
    pub pool: PgPool,
    #[allow(dead_code)]
    pub config: Arc<Config>,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub tutors: TutorStats,
    pub posts: PostStats,
    pub feedback: FeedbackStats,
    pub activity: ActivityStats,
    pub recent_pending_tutors: Vec<PendingTutorRow>,
    pub recent_feedback: Vec<FeedbackRow>,
}

#[derive(Debug, Serialize)]
pub struct TutorStats {
    pub total: i64,
    pub active: i64,
    pub pending_verification: i64,
    pub rejected: i64,
    pub new_this_week: i64,
}

#[derive(Debug, Serialize)]
pub struct PostStats {
    pub total: i64,
    pub published: i64,
    pub drafts: i64,
    pub archived: i64,
}

#[derive(Debug, Serialize)]
pub struct FeedbackStats {
    pub new: i64,
    pub in_progress: i64,
    pub closed: i64,
    pub unread: i64,
}

#[derive(Debug, Serialize)]
pub struct ActivityStats {
    pub profile_views_week: i64,
    pub contact_clicks_week: i64,
    pub registrations_week: i64,
}

#[derive(Debug, Serialize)]
pub struct PendingTutorRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub surname: String,
    pub email: String,
    pub photo_url: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub experience_years: i32,
}

#[derive(Debug, Serialize)]
pub struct FeedbackRow {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: Option<String>,
    pub topic: Option<String>,
    pub message: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct AdminTutorListItem {
    pub id: Uuid,
    pub user_id: Uuid,
    pub slug: String,
    pub name: String,
    pub surname: String,
    pub email: String,
    pub phone: String,
    pub photo_url: Option<String>,
    pub status: String,
    pub verified: bool,
    pub experience_years: i32,
    pub views_count: i32,
    pub contact_clicks_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct AdminTutorFull {
    pub profile: serde_json::Value,
    pub user: serde_json::Value,
    pub subjects: Vec<serde_json::Value>,
    pub education: Vec<serde_json::Value>,
    pub experience: Vec<serde_json::Value>,
    pub documents: Vec<serde_json::Value>,
    pub history: Vec<ModerationHistoryItem>,
}

#[derive(Debug, Serialize)]
pub struct ModerationHistoryItem {
    pub id: Uuid,
    pub admin_id: Uuid,
    pub admin_name: Option<String>,
    pub action: String,
    pub reason: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ModerationActionRequest {
    pub reason: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminTutorFilters {
    pub status: Option<String>,
    pub q: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct Paginated<T> {
    pub data: Vec<T>,
    pub pagination: Pagination,
}

#[derive(Debug, Serialize)]
pub struct Pagination {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug, Serialize)]
pub struct AdminPostListItem {
    pub id: Uuid,
    pub slug: String,
    pub title_ru: String,
    pub status: String,
    pub category_name: Option<String>,
    pub category_id: Option<Uuid>,
    pub author_name: Option<String>,
    pub author_id: Option<Uuid>,
    pub cover_url: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub views_count: i32,
    pub is_featured: bool,
    pub is_pinned: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct AdminPost {
    pub id: Uuid,
    pub slug: String,
    pub title_ru: String,
    pub title_kg: Option<String>,
    pub title_en: Option<String>,
    pub excerpt_ru: Option<String>,
    pub excerpt_kg: Option<String>,
    pub excerpt_en: Option<String>,
    pub content_ru: serde_json::Value,
    pub content_kg: Option<serde_json::Value>,
    pub content_en: Option<serde_json::Value>,
    pub cover_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub tags: Vec<String>,
    pub reading_time: Option<i32>,
    pub status: String,
    pub published_at: Option<DateTime<Utc>>,
    pub views_count: i32,
    pub is_featured: bool,
    pub is_pinned: bool,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_og_image: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    pub slug: String,
    pub title_ru: String,
    #[serde(default)]
    pub excerpt_ru: Option<String>,
    #[serde(default)]
    pub content_ru: Option<serde_json::Value>,
    #[serde(default)]
    pub category_id: Option<Uuid>,
    #[serde(default)]
    pub author_id: Option<Uuid>,
    #[serde(default)]
    pub cover_url: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct UpdatePostRequest {
    pub slug: Option<String>,
    pub title_ru: Option<String>,
    pub title_kg: Option<String>,
    pub title_en: Option<String>,
    pub excerpt_ru: Option<String>,
    pub excerpt_kg: Option<String>,
    pub excerpt_en: Option<String>,
    pub content_ru: Option<serde_json::Value>,
    pub content_kg: Option<serde_json::Value>,
    pub content_en: Option<serde_json::Value>,
    pub cover_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub tags: Option<Vec<String>>,
    pub status: Option<String>,
    pub is_featured: Option<bool>,
    pub is_pinned: Option<bool>,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_og_image: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PostFilters {
    pub status: Option<String>,
    pub category_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub q: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct AdminCategory {
    pub id: Uuid,
    pub slug: String,
    pub name_ru: String,
    pub name_kg: Option<String>,
    pub name_en: Option<String>,
    pub description: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct CategoryRequest {
    pub slug: String,
    pub name_ru: String,
    #[serde(default)]
    pub name_kg: Option<String>,
    #[serde(default)]
    pub name_en: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub sort_order: Option<i32>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct AdminAuthor {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub name: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub role: Option<String>,
    pub socials: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AuthorRequest {
    pub name: String,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub socials: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct AdminFeedback {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub topic: Option<String>,
    pub message: String,
    pub status: String,
    pub notes: Option<String>,
    pub handled_by: Option<Uuid>,
    pub handled_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFeedbackRequest {
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeedbackRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub topic: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct AdminUserListItem {
    pub id: Uuid,
    pub email: String,
    pub phone: String,
    pub name: String,
    pub surname: String,
    pub roles: Vec<String>,
    pub is_blocked: bool,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub has_tutor_profile: bool,
}

#[derive(Debug, Deserialize)]
pub struct UserFilters {
    pub role: Option<String>,
    pub is_blocked: Option<bool>,
    pub q: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct SiteSetting {
    pub key: String,
    pub value: serde_json::Value,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingRequest {
    pub value: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct AdminCity {
    pub id: Uuid,
    pub slug: String,
    pub name_ru: String,
    pub name_kg: Option<String>,
    pub name_en: Option<String>,
    pub country_code: String,
    pub timezone: String,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct CityRequest {
    pub slug: String,
    pub name_ru: String,
    #[serde(default)]
    pub name_kg: Option<String>,
    #[serde(default)]
    pub name_en: Option<String>,
    #[serde(default)]
    pub country_code: Option<String>,
    #[serde(default)]
    pub timezone: Option<String>,
    #[serde(default)]
    pub lat: Option<f64>,
    #[serde(default)]
    pub lng: Option<f64>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct AdminSubject {
    pub id: Uuid,
    pub slug: String,
    pub name_ru: String,
    pub name_kg: Option<String>,
    pub name_en: Option<String>,
    pub icon: Option<String>,
    pub category: Option<String>,
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct SubjectRequest {
    pub slug: String,
    pub name_ru: String,
    #[serde(default)]
    pub name_kg: Option<String>,
    #[serde(default)]
    pub name_en: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct FullAnalytics {
    pub totals: AnalyticsTotals,
    pub views_30d: Vec<TimeSeriesPoint>,
    pub clicks_30d: Vec<TimeSeriesPoint>,
    pub signups_30d: Vec<TimeSeriesPoint>,
    pub top_tutors: Vec<TopTutorRow>,
    pub top_posts: Vec<TopPostRow>,
    pub distribution_by_subject: Vec<DistributionRow>,
    pub distribution_by_city: Vec<DistributionRow>,
}

#[derive(Debug, Serialize)]
pub struct AnalyticsTotals {
    pub users_total: i64,
    pub tutors_total: i64,
    pub tutors_active: i64,
    pub views_total: i64,
    pub clicks_total: i64,
    pub posts_published: i64,
    pub post_views_total: i64,
}

#[derive(Debug, Serialize)]
pub struct TimeSeriesPoint {
    pub day: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct TopTutorRow {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub surname: String,
    pub views_count: i32,
    pub contact_clicks_count: i32,
    pub photo_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TopPostRow {
    pub id: Uuid,
    pub slug: String,
    pub title_ru: String,
    pub views_count: i32,
    pub likes_count: i32,
}

#[derive(Debug, Serialize)]
pub struct DistributionRow {
    pub slug: String,
    pub name_ru: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct AdminMediaItem {
    pub id: Uuid,
    pub url: String,
    pub filename: Option<String>,
    pub mime_type: Option<String>,
    pub size_bytes: Option<i64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub alt_text: Option<String>,
    pub created_at: DateTime<Utc>,
}

fn calculate_reading_time(content: &serde_json::Value) -> i32 {
    let mut total_words = 0usize;
    if let Some(blocks) = content.as_array() {
        for block in blocks {
            let block_type = block.get("type").and_then(|t| t.as_str()).unwrap_or("");
            match block_type {
                "paragraph" | "heading" | "quote" | "callout" => {
                    if let Some(text) = block
                        .get("data")
                        .and_then(|d| d.get("text"))
                        .and_then(|t| t.as_str())
                    {
                        total_words += text.split_whitespace().count();
                    }
                }
                "list" => {
                    if let Some(items) = block
                        .get("data")
                        .and_then(|d| d.get("items"))
                        .and_then(|i| i.as_array())
                    {
                        for item in items {
                            if let Some(text) = item.as_str() {
                                total_words += text.split_whitespace().count();
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }
    let minutes = (total_words as f64) / 200.0;
    minutes.ceil().max(1.0) as i32
}

impl AdminService {
    pub fn new(pool: PgPool, config: Arc<Config>) -> Self {
        Self { pool, config }
    }

    // ===== Audit log =====
    pub async fn log_action(
        &self,
        admin_id: Uuid,
        action: &str,
        target_type: Option<&str>,
        target_id: Option<Uuid>,
        details: Option<serde_json::Value>,
    ) {
        let pool = self.pool.clone();
        let action = action.to_string();
        let target_type = target_type.map(|s| s.to_string());
        tokio::spawn(async move {
            let _ = sqlx::query(
                "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) \
                 VALUES ($1, $2, $3, $4, $5)",
            )
            .bind(admin_id)
            .bind(action)
            .bind(target_type)
            .bind(target_id)
            .bind(details)
            .execute(&pool)
            .await;
        });
    }

    // ===== Dashboard =====
    pub async fn dashboard(&self) -> AppResult<DashboardStats> {
        let tutors = sqlx::query(
            "SELECT \
                COUNT(*) FILTER (WHERE TRUE) AS total, \
                COUNT(*) FILTER (WHERE status = 'active') AS active, \
                COUNT(*) FILTER (WHERE status IN ('pending', 'pending_review')) AS pending, \
                COUNT(*) FILTER (WHERE status = 'rejected') AS rejected, \
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_week \
             FROM tutor_profiles",
        )
        .fetch_one(&self.pool)
        .await?;

        let posts = sqlx::query(
            "SELECT \
                COUNT(*) FILTER (WHERE TRUE) AS total, \
                COUNT(*) FILTER (WHERE status = 'published') AS published, \
                COUNT(*) FILTER (WHERE status = 'draft') AS draft, \
                COUNT(*) FILTER (WHERE status = 'archived') AS archived \
             FROM posts",
        )
        .fetch_one(&self.pool)
        .await?;

        let feedback = sqlx::query(
            "SELECT \
                COUNT(*) FILTER (WHERE status = 'new') AS new_count, \
                COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress, \
                COUNT(*) FILTER (WHERE status = 'closed') AS closed, \
                COUNT(*) FILTER (WHERE status IN ('new', 'in_progress')) AS unread \
             FROM feedback_messages",
        )
        .fetch_one(&self.pool)
        .await?;

        let activity = sqlx::query(
            "SELECT \
                (SELECT COUNT(*) FROM tutor_views WHERE created_at > NOW() - INTERVAL '7 days') AS views, \
                (SELECT COUNT(*) FROM tutor_contact_clicks WHERE created_at > NOW() - INTERVAL '7 days') AS clicks, \
                (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS regs",
        )
        .fetch_one(&self.pool)
        .await?;

        let pending_rows = sqlx::query(
            "SELECT tp.id, tp.user_id, u.name, u.surname, u.email, tp.photo_url, \
                    tp.status, tp.created_at, tp.experience_years \
             FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id \
             WHERE tp.status IN ('pending', 'pending_review') \
             ORDER BY tp.created_at DESC LIMIT 5",
        )
        .fetch_all(&self.pool)
        .await?;

        let recent_pending: Vec<PendingTutorRow> = pending_rows
            .iter()
            .map(|r| PendingTutorRow {
                id: r.try_get("id").unwrap(),
                user_id: r.try_get("user_id").unwrap(),
                name: r.try_get("name").unwrap_or_default(),
                surname: r.try_get("surname").unwrap_or_default(),
                email: r.try_get("email").unwrap_or_default(),
                photo_url: r.try_get("photo_url").ok().flatten(),
                status: r.try_get("status").unwrap_or_default(),
                created_at: r.try_get("created_at").unwrap(),
                experience_years: r.try_get("experience_years").unwrap_or(0),
            })
            .collect();

        let feedback_rows = sqlx::query(
            "SELECT id, name, email, topic, message, status, created_at FROM feedback_messages \
             ORDER BY created_at DESC LIMIT 5",
        )
        .fetch_all(&self.pool)
        .await?;

        let recent_feedback: Vec<FeedbackRow> = feedback_rows
            .iter()
            .map(|r| FeedbackRow {
                id: r.try_get("id").unwrap(),
                name: r.try_get("name").ok().flatten(),
                email: r.try_get("email").ok().flatten(),
                topic: r.try_get("topic").ok().flatten(),
                message: r.try_get("message").unwrap_or_default(),
                status: r.try_get("status").unwrap_or_default(),
                created_at: r.try_get("created_at").unwrap(),
            })
            .collect();

        Ok(DashboardStats {
            tutors: TutorStats {
                total: tutors.try_get("total").unwrap_or(0),
                active: tutors.try_get("active").unwrap_or(0),
                pending_verification: tutors.try_get("pending").unwrap_or(0),
                rejected: tutors.try_get("rejected").unwrap_or(0),
                new_this_week: tutors.try_get("new_week").unwrap_or(0),
            },
            posts: PostStats {
                total: posts.try_get("total").unwrap_or(0),
                published: posts.try_get("published").unwrap_or(0),
                drafts: posts.try_get("draft").unwrap_or(0),
                archived: posts.try_get("archived").unwrap_or(0),
            },
            feedback: FeedbackStats {
                new: feedback.try_get("new_count").unwrap_or(0),
                in_progress: feedback.try_get("in_progress").unwrap_or(0),
                closed: feedback.try_get("closed").unwrap_or(0),
                unread: feedback.try_get("unread").unwrap_or(0),
            },
            activity: ActivityStats {
                profile_views_week: activity.try_get("views").unwrap_or(0),
                contact_clicks_week: activity.try_get("clicks").unwrap_or(0),
                registrations_week: activity.try_get("regs").unwrap_or(0),
            },
            recent_pending_tutors: recent_pending,
            recent_feedback,
        })
    }

    // ===== Tutors =====
    pub async fn list_tutors(
        &self,
        f: AdminTutorFilters,
    ) -> AppResult<Paginated<AdminTutorListItem>> {
        let limit = f.limit.unwrap_or(20).clamp(1, 100);
        let page = f.page.unwrap_or(1).max(1);
        let offset = (page - 1) * limit;

        let mut where_sql = String::from(" WHERE TRUE");
        let mut binds: Vec<String> = Vec::new();

        if let Some(status) = f.status.as_deref().filter(|s| !s.is_empty() && *s != "all") {
            where_sql.push_str(&format!(" AND tp.status = ${}", binds.len() + 1));
            binds.push(status.to_string());
        }
        let q_pattern = f.q.as_deref().filter(|s| !s.trim().is_empty()).map(|q| {
            let p = format!("%{}%", q.replace('%', "\\%"));
            where_sql.push_str(&format!(
                " AND (u.name ILIKE ${idx} OR u.surname ILIKE ${idx} OR u.email ILIKE ${idx})",
                idx = binds.len() + 1
            ));
            p
        });
        if let Some(p) = q_pattern {
            binds.push(p);
        }

        let data_sql = format!(
            "SELECT tp.id, tp.user_id, tp.slug, u.name, u.surname, u.email, u.phone, tp.photo_url, \
                    tp.status, tp.verified, tp.experience_years, tp.views_count, tp.contact_clicks_count, \
                    tp.created_at \
             FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id{} \
             ORDER BY tp.created_at DESC LIMIT ${} OFFSET ${}",
            where_sql,
            binds.len() + 1,
            binds.len() + 2,
        );

        let mut q = sqlx::query(&data_sql);
        for b in &binds {
            q = q.bind(b);
        }
        q = q.bind(limit).bind(offset);
        let rows = q.fetch_all(&self.pool).await?;

        let data: Vec<AdminTutorListItem> = rows
            .iter()
            .map(|r| AdminTutorListItem {
                id: r.try_get("id").unwrap(),
                user_id: r.try_get("user_id").unwrap(),
                slug: r.try_get("slug").unwrap_or_default(),
                name: r.try_get("name").unwrap_or_default(),
                surname: r.try_get("surname").unwrap_or_default(),
                email: r.try_get("email").unwrap_or_default(),
                phone: r.try_get("phone").unwrap_or_default(),
                photo_url: r.try_get("photo_url").ok().flatten(),
                status: r.try_get("status").unwrap_or_default(),
                verified: r.try_get("verified").unwrap_or(false),
                experience_years: r.try_get("experience_years").unwrap_or(0),
                views_count: r.try_get("views_count").unwrap_or(0),
                contact_clicks_count: r.try_get("contact_clicks_count").unwrap_or(0),
                created_at: r.try_get("created_at").unwrap(),
            })
            .collect();

        let count_sql = format!(
            "SELECT COUNT(*) FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id{}",
            where_sql
        );
        let mut cq = sqlx::query_as::<_, (i64,)>(&count_sql);
        for b in &binds {
            cq = cq.bind(b);
        }
        let total: (i64,) = cq.fetch_one(&self.pool).await?;
        let total = total.0;
        let total_pages = if limit == 0 { 0 } else { (total + limit - 1) / limit };

        Ok(Paginated {
            data,
            pagination: Pagination { page, limit, total, total_pages },
        })
    }

    pub async fn get_tutor_full(&self, tutor_id: Uuid) -> AppResult<AdminTutorFull> {
        let row = sqlx::query(
            "SELECT to_jsonb(tp.*) AS profile, to_jsonb(u.*) AS user_data \
             FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id \
             WHERE tp.id = $1",
        )
        .bind(tutor_id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;

        let profile: serde_json::Value = row.try_get("profile")?;
        let user: serde_json::Value = row.try_get("user_data")?;

        let subjects_rows = sqlx::query(
            "SELECT to_jsonb(s.*) AS data FROM tutor_subjects ts \
             JOIN subjects s ON ts.subject_id = s.id WHERE ts.tutor_id = $1",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;
        let subjects: Vec<serde_json::Value> = subjects_rows
            .iter()
            .map(|r| r.try_get("data").unwrap_or(serde_json::Value::Null))
            .collect();

        let edu_rows = sqlx::query(
            "SELECT to_jsonb(t.*) AS data FROM tutor_education t WHERE t.tutor_id = $1 ORDER BY year_end DESC NULLS LAST",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;
        let education: Vec<serde_json::Value> = edu_rows
            .iter()
            .map(|r| r.try_get("data").unwrap_or(serde_json::Value::Null))
            .collect();

        let exp_rows = sqlx::query(
            "SELECT to_jsonb(t.*) AS data FROM tutor_experience t WHERE t.tutor_id = $1 ORDER BY year_end DESC NULLS LAST",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;
        let experience: Vec<serde_json::Value> = exp_rows
            .iter()
            .map(|r| r.try_get("data").unwrap_or(serde_json::Value::Null))
            .collect();

        let doc_rows = sqlx::query(
            "SELECT to_jsonb(t.*) AS data FROM tutor_documents t WHERE t.tutor_id = $1 ORDER BY created_at DESC",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;
        let documents: Vec<serde_json::Value> = doc_rows
            .iter()
            .map(|r| r.try_get("data").unwrap_or(serde_json::Value::Null))
            .collect();

        let hist_rows = sqlx::query(
            "SELECT h.id, h.admin_id, h.action, h.reason, h.notes, h.created_at, \
                    u.name || ' ' || u.surname AS admin_name \
             FROM tutor_moderation_history h \
             LEFT JOIN users u ON h.admin_id = u.id \
             WHERE h.tutor_id = $1 ORDER BY h.created_at DESC",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let history: Vec<ModerationHistoryItem> = hist_rows
            .iter()
            .map(|r| ModerationHistoryItem {
                id: r.try_get("id").unwrap(),
                admin_id: r.try_get("admin_id").unwrap(),
                admin_name: r.try_get("admin_name").ok().flatten(),
                action: r.try_get("action").unwrap_or_default(),
                reason: r.try_get("reason").ok().flatten(),
                notes: r.try_get("notes").ok().flatten(),
                created_at: r.try_get("created_at").unwrap(),
            })
            .collect();

        Ok(AdminTutorFull {
            profile,
            user,
            subjects,
            education,
            experience,
            documents,
            history,
        })
    }

    async fn record_history(
        &self,
        tutor_id: Uuid,
        admin_id: Uuid,
        action: &str,
        reason: Option<&str>,
        notes: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO tutor_moderation_history (tutor_id, admin_id, action, reason, notes) \
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(tutor_id)
        .bind(admin_id)
        .bind(action)
        .bind(reason)
        .bind(notes)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn approve_tutor(
        &self,
        tutor_id: Uuid,
        admin_id: Uuid,
        notes: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE tutor_profiles SET status = 'active', verified = TRUE, rejection_reason = NULL \
             WHERE id = $1",
        )
        .bind(tutor_id)
        .execute(&self.pool)
        .await?;
        self.record_history(tutor_id, admin_id, "approved", None, notes).await?;
        Ok(())
    }

    pub async fn reject_tutor(
        &self,
        tutor_id: Uuid,
        admin_id: Uuid,
        reason: &str,
        notes: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE tutor_profiles SET status = 'rejected', verified = FALSE, rejection_reason = $2 WHERE id = $1",
        )
        .bind(tutor_id)
        .bind(reason)
        .execute(&self.pool)
        .await?;
        self.record_history(tutor_id, admin_id, "rejected", Some(reason), notes).await?;
        Ok(())
    }

    pub async fn request_changes(
        &self,
        tutor_id: Uuid,
        admin_id: Uuid,
        reason: &str,
        notes: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE tutor_profiles SET status = 'pending', rejection_reason = $2 WHERE id = $1",
        )
        .bind(tutor_id)
        .bind(reason)
        .execute(&self.pool)
        .await?;
        self.record_history(tutor_id, admin_id, "changes_requested", Some(reason), notes).await?;
        Ok(())
    }

    pub async fn block_tutor(
        &self,
        tutor_id: Uuid,
        admin_id: Uuid,
        reason: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query("UPDATE tutor_profiles SET status = 'inactive' WHERE id = $1")
            .bind(tutor_id)
            .execute(&self.pool)
            .await?;
        self.record_history(tutor_id, admin_id, "blocked", reason, None).await?;
        Ok(())
    }

    pub async fn unblock_tutor(&self, tutor_id: Uuid, admin_id: Uuid) -> AppResult<()> {
        sqlx::query("UPDATE tutor_profiles SET status = 'active' WHERE id = $1")
            .bind(tutor_id)
            .execute(&self.pool)
            .await?;
        self.record_history(tutor_id, admin_id, "unblocked", None, None).await?;
        Ok(())
    }

    pub async fn delete_tutor(&self, tutor_id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM tutor_profiles WHERE id = $1")
            .bind(tutor_id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    // ===== Cities =====
    pub async fn list_cities(&self) -> AppResult<Vec<AdminCity>> {
        let rows = sqlx::query(
            "SELECT id, slug, name_ru, name_kg, name_en, country_code, timezone, lat, lng, is_active \
             FROM cities ORDER BY name_ru",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .iter()
            .map(|r| AdminCity {
                id: r.try_get("id").unwrap(),
                slug: r.try_get("slug").unwrap_or_default(),
                name_ru: r.try_get("name_ru").unwrap_or_default(),
                name_kg: r.try_get("name_kg").ok().flatten(),
                name_en: r.try_get("name_en").ok().flatten(),
                country_code: r.try_get("country_code").unwrap_or_else(|_| "KG".to_string()),
                timezone: r
                    .try_get("timezone")
                    .unwrap_or_else(|_| "Asia/Bishkek".to_string()),
                lat: r.try_get("lat").ok().flatten(),
                lng: r.try_get("lng").ok().flatten(),
                is_active: r.try_get("is_active").unwrap_or(true),
            })
            .collect())
    }

    pub async fn create_city(&self, p: CityRequest) -> AppResult<AdminCity> {
        let row = sqlx::query(
            "INSERT INTO cities (slug, name_ru, name_kg, name_en, country_code, timezone, lat, lng, is_active) \
             VALUES ($1, $2, $3, $4, COALESCE($5, 'KG'), COALESCE($6, 'Asia/Bishkek'), $7, $8, COALESCE($9, TRUE)) \
             RETURNING id",
        )
        .bind(&p.slug)
        .bind(&p.name_ru)
        .bind(p.name_kg.as_deref())
        .bind(p.name_en.as_deref())
        .bind(p.country_code.as_deref())
        .bind(p.timezone.as_deref())
        .bind(p.lat)
        .bind(p.lng)
        .bind(p.is_active)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match &e {
            sqlx::Error::Database(db) if db.is_unique_violation() => {
                AppError::Conflict("city slug already exists".into())
            }
            _ => AppError::Database(e),
        })?;
        let id: Uuid = row.try_get("id")?;
        self.get_city(id).await
    }

    pub async fn get_city(&self, id: Uuid) -> AppResult<AdminCity> {
        let row = sqlx::query(
            "SELECT id, slug, name_ru, name_kg, name_en, country_code, timezone, lat, lng, is_active \
             FROM cities WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;
        Ok(AdminCity {
            id: row.try_get("id")?,
            slug: row.try_get("slug")?,
            name_ru: row.try_get("name_ru")?,
            name_kg: row.try_get("name_kg").ok().flatten(),
            name_en: row.try_get("name_en").ok().flatten(),
            country_code: row.try_get("country_code")?,
            timezone: row.try_get("timezone")?,
            lat: row.try_get("lat").ok().flatten(),
            lng: row.try_get("lng").ok().flatten(),
            is_active: row.try_get("is_active").unwrap_or(true),
        })
    }

    pub async fn update_city(&self, id: Uuid, p: CityRequest) -> AppResult<AdminCity> {
        sqlx::query(
            "UPDATE cities SET slug = $2, name_ru = $3, name_kg = $4, name_en = $5, \
                                country_code = COALESCE($6, country_code), \
                                timezone = COALESCE($7, timezone), \
                                lat = $8, lng = $9, \
                                is_active = COALESCE($10, is_active) \
             WHERE id = $1",
        )
        .bind(id)
        .bind(&p.slug)
        .bind(&p.name_ru)
        .bind(p.name_kg.as_deref())
        .bind(p.name_en.as_deref())
        .bind(p.country_code.as_deref())
        .bind(p.timezone.as_deref())
        .bind(p.lat)
        .bind(p.lng)
        .bind(p.is_active)
        .execute(&self.pool)
        .await?;
        self.get_city(id).await
    }

    pub async fn delete_city(&self, id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM cities WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    // ===== Subjects =====
    pub async fn list_subjects(&self) -> AppResult<Vec<AdminSubject>> {
        let rows = sqlx::query(
            "SELECT id, slug, name_ru, name_kg, name_en, icon, category, sort_order \
             FROM subjects ORDER BY sort_order ASC, name_ru ASC",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .iter()
            .map(|r| AdminSubject {
                id: r.try_get("id").unwrap(),
                slug: r.try_get("slug").unwrap_or_default(),
                name_ru: r.try_get("name_ru").unwrap_or_default(),
                name_kg: r.try_get("name_kg").ok().flatten(),
                name_en: r.try_get("name_en").ok().flatten(),
                icon: r.try_get("icon").ok().flatten(),
                category: r.try_get("category").ok().flatten(),
                sort_order: r.try_get("sort_order").unwrap_or(0),
            })
            .collect())
    }

    pub async fn create_subject(&self, p: SubjectRequest) -> AppResult<AdminSubject> {
        let row = sqlx::query(
            "INSERT INTO subjects (slug, name_ru, name_kg, name_en, icon, category, sort_order) \
             VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0)) RETURNING id",
        )
        .bind(&p.slug)
        .bind(&p.name_ru)
        .bind(p.name_kg.as_deref())
        .bind(p.name_en.as_deref())
        .bind(p.icon.as_deref())
        .bind(p.category.as_deref())
        .bind(p.sort_order)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match &e {
            sqlx::Error::Database(db) if db.is_unique_violation() => {
                AppError::Conflict("subject slug already exists".into())
            }
            _ => AppError::Database(e),
        })?;
        let id: Uuid = row.try_get("id")?;
        self.get_subject(id).await
    }

    pub async fn get_subject(&self, id: Uuid) -> AppResult<AdminSubject> {
        let row = sqlx::query(
            "SELECT id, slug, name_ru, name_kg, name_en, icon, category, sort_order FROM subjects WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;
        Ok(AdminSubject {
            id: row.try_get("id")?,
            slug: row.try_get("slug")?,
            name_ru: row.try_get("name_ru")?,
            name_kg: row.try_get("name_kg").ok().flatten(),
            name_en: row.try_get("name_en").ok().flatten(),
            icon: row.try_get("icon").ok().flatten(),
            category: row.try_get("category").ok().flatten(),
            sort_order: row.try_get("sort_order").unwrap_or(0),
        })
    }

    pub async fn update_subject(&self, id: Uuid, p: SubjectRequest) -> AppResult<AdminSubject> {
        sqlx::query(
            "UPDATE subjects SET slug = $2, name_ru = $3, name_kg = $4, name_en = $5, \
                                  icon = $6, category = $7, sort_order = COALESCE($8, sort_order) \
             WHERE id = $1",
        )
        .bind(id)
        .bind(&p.slug)
        .bind(&p.name_ru)
        .bind(p.name_kg.as_deref())
        .bind(p.name_en.as_deref())
        .bind(p.icon.as_deref())
        .bind(p.category.as_deref())
        .bind(p.sort_order)
        .execute(&self.pool)
        .await?;
        self.get_subject(id).await
    }

    pub async fn delete_subject(&self, id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM subjects WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    // ===== Analytics =====
    pub async fn full_analytics(&self) -> AppResult<FullAnalytics> {
        let totals = sqlx::query(
            "SELECT \
                (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS users_total, \
                (SELECT COUNT(*) FROM tutor_profiles) AS tutors_total, \
                (SELECT COUNT(*) FROM tutor_profiles WHERE status = 'active') AS tutors_active, \
                (SELECT COUNT(*) FROM tutor_views) AS views_total, \
                (SELECT COUNT(*) FROM tutor_contact_clicks) AS clicks_total, \
                (SELECT COUNT(*) FROM posts WHERE status = 'published') AS posts_published, \
                (SELECT COALESCE(SUM(views_count), 0) FROM posts) AS post_views_total",
        )
        .fetch_one(&self.pool)
        .await?;

        let series_views = sqlx::query(
            "SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS cnt \
             FROM tutor_views \
             WHERE created_at > NOW() - INTERVAL '30 days' \
             GROUP BY 1 ORDER BY 1",
        )
        .fetch_all(&self.pool)
        .await?;

        let series_clicks = sqlx::query(
            "SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS cnt \
             FROM tutor_contact_clicks \
             WHERE created_at > NOW() - INTERVAL '30 days' \
             GROUP BY 1 ORDER BY 1",
        )
        .fetch_all(&self.pool)
        .await?;

        let series_signups = sqlx::query(
            "SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS cnt \
             FROM users \
             WHERE created_at > NOW() - INTERVAL '30 days' \
             GROUP BY 1 ORDER BY 1",
        )
        .fetch_all(&self.pool)
        .await?;

        let top_tutors = sqlx::query(
            "SELECT tp.id, tp.slug, u.name, u.surname, tp.views_count, tp.contact_clicks_count, \
                    tp.photo_url \
             FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id \
             WHERE tp.status = 'active' \
             ORDER BY tp.views_count DESC LIMIT 10",
        )
        .fetch_all(&self.pool)
        .await?;

        let top_posts = sqlx::query(
            "SELECT id, slug, title_ru, views_count, likes_count \
             FROM posts WHERE status = 'published' \
             ORDER BY views_count DESC LIMIT 10",
        )
        .fetch_all(&self.pool)
        .await?;

        let by_subject = sqlx::query(
            "SELECT s.slug, s.name_ru, COUNT(*) AS cnt \
             FROM tutor_subjects ts JOIN subjects s ON s.id = ts.subject_id \
             JOIN tutor_profiles tp ON tp.id = ts.tutor_id \
             WHERE tp.status = 'active' \
             GROUP BY s.slug, s.name_ru ORDER BY cnt DESC LIMIT 12",
        )
        .fetch_all(&self.pool)
        .await?;

        let by_city = sqlx::query(
            "SELECT c.slug, c.name_ru, COUNT(*) AS cnt \
             FROM tutor_profiles tp JOIN cities c ON c.id = tp.city_id \
             WHERE tp.status = 'active' \
             GROUP BY c.slug, c.name_ru ORDER BY cnt DESC LIMIT 12",
        )
        .fetch_all(&self.pool)
        .await?;

        let series = |rows: Vec<sqlx::postgres::PgRow>| -> Vec<TimeSeriesPoint> {
            rows.iter()
                .map(|r| TimeSeriesPoint {
                    day: r.try_get("day").unwrap_or_default(),
                    count: r.try_get::<i64, _>("cnt").unwrap_or(0),
                })
                .collect()
        };

        Ok(FullAnalytics {
            totals: AnalyticsTotals {
                users_total: totals.try_get("users_total").unwrap_or(0),
                tutors_total: totals.try_get("tutors_total").unwrap_or(0),
                tutors_active: totals.try_get("tutors_active").unwrap_or(0),
                views_total: totals.try_get("views_total").unwrap_or(0),
                clicks_total: totals.try_get("clicks_total").unwrap_or(0),
                posts_published: totals.try_get("posts_published").unwrap_or(0),
                post_views_total: totals.try_get("post_views_total").unwrap_or(0),
            },
            views_30d: series(series_views),
            clicks_30d: series(series_clicks),
            signups_30d: series(series_signups),
            top_tutors: top_tutors
                .iter()
                .map(|r| TopTutorRow {
                    id: r.try_get("id").unwrap(),
                    slug: r.try_get("slug").unwrap_or_default(),
                    name: r.try_get("name").unwrap_or_default(),
                    surname: r.try_get("surname").unwrap_or_default(),
                    views_count: r.try_get("views_count").unwrap_or(0),
                    contact_clicks_count: r.try_get("contact_clicks_count").unwrap_or(0),
                    photo_url: r.try_get("photo_url").ok().flatten(),
                })
                .collect(),
            top_posts: top_posts
                .iter()
                .map(|r| TopPostRow {
                    id: r.try_get("id").unwrap(),
                    slug: r.try_get("slug").unwrap_or_default(),
                    title_ru: r.try_get("title_ru").unwrap_or_default(),
                    views_count: r.try_get("views_count").unwrap_or(0),
                    likes_count: r.try_get("likes_count").unwrap_or(0),
                })
                .collect(),
            distribution_by_subject: by_subject
                .iter()
                .map(|r| DistributionRow {
                    slug: r.try_get("slug").unwrap_or_default(),
                    name_ru: r.try_get("name_ru").unwrap_or_default(),
                    count: r.try_get::<i64, _>("cnt").unwrap_or(0),
                })
                .collect(),
            distribution_by_city: by_city
                .iter()
                .map(|r| DistributionRow {
                    slug: r.try_get("slug").unwrap_or_default(),
                    name_ru: r.try_get("name_ru").unwrap_or_default(),
                    count: r.try_get::<i64, _>("cnt").unwrap_or(0),
                })
                .collect(),
        })
    }

    // ===== Posts =====
    pub async fn list_posts(&self, f: PostFilters) -> AppResult<Paginated<AdminPostListItem>> {
        let limit = f.limit.unwrap_or(20).clamp(1, 100);
        let page = f.page.unwrap_or(1).max(1);
        let offset = (page - 1) * limit;

        let mut where_sql = String::from(" WHERE TRUE");
        let mut idx = 0;
        let mut binds: Vec<serde_json::Value> = Vec::new();

        if let Some(status) = f.status.as_deref().filter(|s| !s.is_empty() && *s != "all") {
            idx += 1;
            where_sql.push_str(&format!(" AND p.status = ${}", idx));
            binds.push(serde_json::Value::String(status.to_string()));
        }
        if let Some(cat) = f.category_id {
            idx += 1;
            where_sql.push_str(&format!(" AND p.category_id = ${}", idx));
            binds.push(serde_json::Value::String(cat.to_string()));
        }
        if let Some(au) = f.author_id {
            idx += 1;
            where_sql.push_str(&format!(" AND p.author_id = ${}", idx));
            binds.push(serde_json::Value::String(au.to_string()));
        }
        let q_text = f.q.as_deref().filter(|s| !s.trim().is_empty()).map(|s| s.to_string());
        if let Some(qt) = &q_text {
            idx += 1;
            where_sql.push_str(&format!(" AND (p.title_ru ILIKE ${i} OR p.slug ILIKE ${i})", i = idx));
            binds.push(serde_json::Value::String(format!(
                "%{}%",
                qt.replace('%', "\\%")
            )));
        }

        let data_sql = format!(
            "SELECT p.id, p.slug, p.title_ru, p.status, p.cover_url, p.published_at, \
                    p.views_count, p.is_featured, p.is_pinned, p.created_at, \
                    p.category_id, pc.name_ru AS category_name, \
                    p.author_id, pa.name AS author_name \
             FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id{} \
             ORDER BY p.created_at DESC LIMIT ${} OFFSET ${}",
            where_sql,
            idx + 1,
            idx + 2
        );

        let mut q = sqlx::query(&data_sql);
        for b in &binds {
            if let Some(s) = b.as_str() {
                q = q.bind(s.to_string());
            }
        }
        q = q.bind(limit).bind(offset);
        let rows = q.fetch_all(&self.pool).await?;

        let data: Vec<AdminPostListItem> = rows
            .iter()
            .map(|r| AdminPostListItem {
                id: r.try_get("id").unwrap(),
                slug: r.try_get("slug").unwrap_or_default(),
                title_ru: r.try_get("title_ru").unwrap_or_default(),
                status: r.try_get("status").unwrap_or_default(),
                cover_url: r.try_get("cover_url").ok().flatten(),
                published_at: r.try_get("published_at").ok().flatten(),
                views_count: r.try_get("views_count").unwrap_or(0),
                is_featured: r.try_get("is_featured").unwrap_or(false),
                is_pinned: r.try_get("is_pinned").unwrap_or(false),
                created_at: r.try_get("created_at").unwrap(),
                category_id: r.try_get("category_id").ok().flatten(),
                category_name: r.try_get("category_name").ok().flatten(),
                author_id: r.try_get("author_id").ok().flatten(),
                author_name: r.try_get("author_name").ok().flatten(),
            })
            .collect();

        let count_sql = format!(
            "SELECT COUNT(*) FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id{}",
            where_sql
        );
        let mut cq = sqlx::query_as::<_, (i64,)>(&count_sql);
        for b in &binds {
            if let Some(s) = b.as_str() {
                cq = cq.bind(s.to_string());
            }
        }
        let total: (i64,) = cq.fetch_one(&self.pool).await?;
        let total_pages = if limit == 0 { 0 } else { (total.0 + limit - 1) / limit };

        Ok(Paginated {
            data,
            pagination: Pagination { page, limit, total: total.0, total_pages },
        })
    }

    pub async fn get_post(&self, id: Uuid) -> AppResult<AdminPost> {
        let row = sqlx::query(
            "SELECT id, slug, title_ru, title_kg, title_en, excerpt_ru, excerpt_kg, excerpt_en, \
                    content_ru, content_kg, content_en, cover_url, category_id, author_id, tags, \
                    reading_time, status, published_at, views_count, is_featured, is_pinned, \
                    seo_title, seo_description, seo_og_image, created_at, updated_at \
             FROM posts WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;

        Ok(AdminPost {
            id: row.try_get("id")?,
            slug: row.try_get("slug")?,
            title_ru: row.try_get("title_ru")?,
            title_kg: row.try_get("title_kg").ok().flatten(),
            title_en: row.try_get("title_en").ok().flatten(),
            excerpt_ru: row.try_get("excerpt_ru").ok().flatten(),
            excerpt_kg: row.try_get("excerpt_kg").ok().flatten(),
            excerpt_en: row.try_get("excerpt_en").ok().flatten(),
            content_ru: row.try_get("content_ru")?,
            content_kg: row.try_get("content_kg").ok().flatten(),
            content_en: row.try_get("content_en").ok().flatten(),
            cover_url: row.try_get("cover_url").ok().flatten(),
            category_id: row.try_get("category_id").ok().flatten(),
            author_id: row.try_get("author_id").ok().flatten(),
            tags: row.try_get("tags").unwrap_or_default(),
            reading_time: row.try_get("reading_time").ok().flatten(),
            status: row.try_get("status")?,
            published_at: row.try_get("published_at").ok().flatten(),
            views_count: row.try_get("views_count").unwrap_or(0),
            is_featured: row.try_get("is_featured").unwrap_or(false),
            is_pinned: row.try_get("is_pinned").unwrap_or(false),
            seo_title: row.try_get("seo_title").ok().flatten(),
            seo_description: row.try_get("seo_description").ok().flatten(),
            seo_og_image: row.try_get("seo_og_image").ok().flatten(),
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }

    pub async fn create_post(&self, payload: CreatePostRequest) -> AppResult<AdminPost> {
        let content = payload.content_ru.unwrap_or_else(|| serde_json::json!([]));
        let reading_time = calculate_reading_time(&content);
        let row = sqlx::query(
            "INSERT INTO posts (slug, title_ru, excerpt_ru, content_ru, cover_url, category_id, author_id, tags, reading_time, status) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, ARRAY[]::TEXT[], $8, 'draft') RETURNING id",
        )
        .bind(&payload.slug)
        .bind(&payload.title_ru)
        .bind(payload.excerpt_ru.as_deref())
        .bind(&content)
        .bind(payload.cover_url.as_deref())
        .bind(payload.category_id)
        .bind(payload.author_id)
        .bind(reading_time)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match &e {
            sqlx::Error::Database(db) if db.is_unique_violation() => {
                AppError::Conflict("post slug already exists".into())
            }
            _ => AppError::Database(e),
        })?;

        let id: Uuid = row.try_get("id")?;
        self.get_post(id).await
    }

    pub async fn update_post(&self, id: Uuid, payload: UpdatePostRequest) -> AppResult<AdminPost> {
        // Recalculate reading time if content_ru is updated
        if let Some(ref content) = payload.content_ru {
            let rt = calculate_reading_time(content);
            sqlx::query("UPDATE posts SET reading_time = $2 WHERE id = $1")
                .bind(id)
                .bind(rt)
                .execute(&self.pool)
                .await?;
        }

        let mut sets: Vec<String> = Vec::new();
        let mut binds: Vec<serde_json::Value> = Vec::new();

        if let Some(v) = payload.slug {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("slug = ${}", binds.len()));
        }
        if let Some(v) = payload.title_ru {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("title_ru = ${}", binds.len()));
        }
        if let Some(v) = payload.title_kg {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("title_kg = ${}", binds.len()));
        }
        if let Some(v) = payload.title_en {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("title_en = ${}", binds.len()));
        }
        if let Some(v) = payload.excerpt_ru {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("excerpt_ru = ${}", binds.len()));
        }
        if let Some(v) = payload.excerpt_kg {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("excerpt_kg = ${}", binds.len()));
        }
        if let Some(v) = payload.excerpt_en {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("excerpt_en = ${}", binds.len()));
        }
        if let Some(v) = payload.content_ru {
            binds.push(v);
            sets.push(format!("content_ru = ${}", binds.len()));
        }
        if let Some(v) = payload.content_kg {
            binds.push(v);
            sets.push(format!("content_kg = ${}", binds.len()));
        }
        if let Some(v) = payload.content_en {
            binds.push(v);
            sets.push(format!("content_en = ${}", binds.len()));
        }
        if let Some(v) = payload.cover_url {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("cover_url = ${}", binds.len()));
        }
        if let Some(v) = payload.category_id {
            binds.push(serde_json::Value::String(v.to_string()));
            sets.push(format!("category_id = ${}::uuid", binds.len()));
        }
        if let Some(v) = payload.author_id {
            binds.push(serde_json::Value::String(v.to_string()));
            sets.push(format!("author_id = ${}::uuid", binds.len()));
        }
        if let Some(v) = payload.tags {
            binds.push(serde_json::to_value(v).unwrap_or(serde_json::Value::Null));
            sets.push(format!("tags = ${}::text[]", binds.len()));
        }
        if let Some(v) = payload.status {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("status = ${}", binds.len()));
        }
        if let Some(v) = payload.is_featured {
            binds.push(serde_json::Value::Bool(v));
            sets.push(format!("is_featured = ${}", binds.len()));
        }
        if let Some(v) = payload.is_pinned {
            binds.push(serde_json::Value::Bool(v));
            sets.push(format!("is_pinned = ${}", binds.len()));
        }
        if let Some(v) = payload.seo_title {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("seo_title = ${}", binds.len()));
        }
        if let Some(v) = payload.seo_description {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("seo_description = ${}", binds.len()));
        }
        if let Some(v) = payload.seo_og_image {
            binds.push(serde_json::Value::String(v));
            sets.push(format!("seo_og_image = ${}", binds.len()));
        }

        if !sets.is_empty() {
            let sql = format!(
                "UPDATE posts SET {} WHERE id = ${}",
                sets.join(", "),
                binds.len() + 1
            );
            let mut q = sqlx::query(&sql);
            for b in binds {
                q = bind_json_value(q, b);
            }
            q = q.bind(id);
            q.execute(&self.pool).await.map_err(|e| match &e {
                sqlx::Error::Database(db) if db.is_unique_violation() => {
                    AppError::Conflict("slug already exists".into())
                }
                _ => AppError::Database(e),
            })?;
        }

        self.get_post(id).await
    }

    pub async fn publish_post(&self, id: Uuid) -> AppResult<AdminPost> {
        sqlx::query(
            "UPDATE posts SET status = 'published', published_at = COALESCE(published_at, NOW()) WHERE id = $1",
        )
        .bind(id)
        .execute(&self.pool)
        .await?;
        self.get_post(id).await
    }

    pub async fn unpublish_post(&self, id: Uuid) -> AppResult<AdminPost> {
        sqlx::query("UPDATE posts SET status = 'draft' WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        self.get_post(id).await
    }

    pub async fn delete_post(&self, id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM posts WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    pub async fn duplicate_post(&self, id: Uuid) -> AppResult<AdminPost> {
        let src = self.get_post(id).await?;
        let new_slug = format!("{}-copy-{}", src.slug, &Uuid::new_v4().to_string()[..6]);
        let row = sqlx::query(
            "INSERT INTO posts (slug, title_ru, title_kg, title_en, excerpt_ru, excerpt_kg, excerpt_en, \
                                content_ru, content_kg, content_en, cover_url, category_id, author_id, tags, \
                                reading_time, status) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft') RETURNING id",
        )
        .bind(new_slug)
        .bind(format!("{} (копия)", src.title_ru))
        .bind(src.title_kg)
        .bind(src.title_en)
        .bind(src.excerpt_ru)
        .bind(src.excerpt_kg)
        .bind(src.excerpt_en)
        .bind(src.content_ru)
        .bind(src.content_kg)
        .bind(src.content_en)
        .bind(src.cover_url)
        .bind(src.category_id)
        .bind(src.author_id)
        .bind(&src.tags)
        .bind(src.reading_time)
        .fetch_one(&self.pool)
        .await?;
        let new_id: Uuid = row.try_get("id")?;
        self.get_post(new_id).await
    }

    // ===== Categories =====
    pub async fn list_categories(&self) -> AppResult<Vec<AdminCategory>> {
        let rows = sqlx::query(
            "SELECT id, slug, name_ru, name_kg, name_en, description, sort_order, is_active \
             FROM post_categories ORDER BY sort_order ASC, name_ru ASC",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .iter()
            .map(|r| AdminCategory {
                id: r.try_get("id").unwrap(),
                slug: r.try_get("slug").unwrap_or_default(),
                name_ru: r.try_get("name_ru").unwrap_or_default(),
                name_kg: r.try_get("name_kg").ok().flatten(),
                name_en: r.try_get("name_en").ok().flatten(),
                description: r.try_get("description").ok().flatten(),
                sort_order: r.try_get("sort_order").unwrap_or(0),
                is_active: r.try_get("is_active").unwrap_or(true),
            })
            .collect())
    }

    pub async fn create_category(&self, p: CategoryRequest) -> AppResult<AdminCategory> {
        let row = sqlx::query(
            "INSERT INTO post_categories (slug, name_ru, name_kg, name_en, description, sort_order, is_active) \
             VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0), COALESCE($7, TRUE)) RETURNING id",
        )
        .bind(&p.slug)
        .bind(&p.name_ru)
        .bind(p.name_kg.as_deref())
        .bind(p.name_en.as_deref())
        .bind(p.description.as_deref())
        .bind(p.sort_order)
        .bind(p.is_active)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match &e {
            sqlx::Error::Database(db) if db.is_unique_violation() => {
                AppError::Conflict("slug already exists".into())
            }
            _ => AppError::Database(e),
        })?;
        let id: Uuid = row.try_get("id")?;
        self.get_category(id).await
    }

    pub async fn get_category(&self, id: Uuid) -> AppResult<AdminCategory> {
        let row = sqlx::query(
            "SELECT id, slug, name_ru, name_kg, name_en, description, sort_order, is_active \
             FROM post_categories WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;
        Ok(AdminCategory {
            id: row.try_get("id")?,
            slug: row.try_get("slug")?,
            name_ru: row.try_get("name_ru")?,
            name_kg: row.try_get("name_kg").ok().flatten(),
            name_en: row.try_get("name_en").ok().flatten(),
            description: row.try_get("description").ok().flatten(),
            sort_order: row.try_get("sort_order").unwrap_or(0),
            is_active: row.try_get("is_active").unwrap_or(true),
        })
    }

    pub async fn update_category(&self, id: Uuid, p: CategoryRequest) -> AppResult<AdminCategory> {
        sqlx::query(
            "UPDATE post_categories SET slug = $2, name_ru = $3, name_kg = $4, name_en = $5, \
                                        description = $6, sort_order = COALESCE($7, sort_order), is_active = COALESCE($8, is_active) \
             WHERE id = $1",
        )
        .bind(id)
        .bind(&p.slug)
        .bind(&p.name_ru)
        .bind(p.name_kg.as_deref())
        .bind(p.name_en.as_deref())
        .bind(p.description.as_deref())
        .bind(p.sort_order)
        .bind(p.is_active)
        .execute(&self.pool)
        .await?;
        self.get_category(id).await
    }

    pub async fn delete_category(&self, id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM post_categories WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    // ===== Authors =====
    pub async fn list_authors(&self) -> AppResult<Vec<AdminAuthor>> {
        let rows = sqlx::query(
            "SELECT id, user_id, name, bio, avatar_url, role, socials, created_at FROM post_authors ORDER BY created_at DESC",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .iter()
            .map(|r| AdminAuthor {
                id: r.try_get("id").unwrap(),
                user_id: r.try_get("user_id").ok().flatten(),
                name: r.try_get("name").unwrap_or_default(),
                bio: r.try_get("bio").ok().flatten(),
                avatar_url: r.try_get("avatar_url").ok().flatten(),
                role: r.try_get("role").ok().flatten(),
                socials: r.try_get("socials").unwrap_or(serde_json::Value::Object(serde_json::Map::new())),
                created_at: r.try_get("created_at").unwrap(),
            })
            .collect())
    }

    pub async fn create_author(&self, p: AuthorRequest) -> AppResult<AdminAuthor> {
        let row = sqlx::query(
            "INSERT INTO post_authors (name, bio, avatar_url, role, socials) \
             VALUES ($1, $2, $3, $4, COALESCE($5, '{}'::jsonb)) RETURNING id",
        )
        .bind(&p.name)
        .bind(p.bio.as_deref())
        .bind(p.avatar_url.as_deref())
        .bind(p.role.as_deref())
        .bind(p.socials)
        .fetch_one(&self.pool)
        .await?;
        let id: Uuid = row.try_get("id")?;
        self.get_author(id).await
    }

    pub async fn get_author(&self, id: Uuid) -> AppResult<AdminAuthor> {
        let row = sqlx::query(
            "SELECT id, user_id, name, bio, avatar_url, role, socials, created_at FROM post_authors WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;
        Ok(AdminAuthor {
            id: row.try_get("id")?,
            user_id: row.try_get("user_id").ok().flatten(),
            name: row.try_get("name")?,
            bio: row.try_get("bio").ok().flatten(),
            avatar_url: row.try_get("avatar_url").ok().flatten(),
            role: row.try_get("role").ok().flatten(),
            socials: row.try_get("socials").unwrap_or(serde_json::Value::Object(serde_json::Map::new())),
            created_at: row.try_get("created_at")?,
        })
    }

    pub async fn update_author(&self, id: Uuid, p: AuthorRequest) -> AppResult<AdminAuthor> {
        sqlx::query(
            "UPDATE post_authors SET name = $2, bio = $3, avatar_url = $4, role = $5, socials = COALESCE($6, socials) \
             WHERE id = $1",
        )
        .bind(id)
        .bind(&p.name)
        .bind(p.bio.as_deref())
        .bind(p.avatar_url.as_deref())
        .bind(p.role.as_deref())
        .bind(p.socials)
        .execute(&self.pool)
        .await?;
        self.get_author(id).await
    }

    pub async fn delete_author(&self, id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM post_authors WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    // ===== Feedback =====
    pub async fn list_feedback(
        &self,
        status: Option<&str>,
        page: i64,
        limit: i64,
    ) -> AppResult<Paginated<AdminFeedback>> {
        let offset = (page.max(1) - 1) * limit;
        let mut where_sql = String::from(" WHERE TRUE");
        let mut binds: Vec<String> = Vec::new();
        if let Some(s) = status.filter(|s| !s.is_empty() && *s != "all") {
            where_sql.push_str(&format!(" AND status = ${}", binds.len() + 1));
            binds.push(s.to_string());
        }
        let data_sql = format!(
            "SELECT id, name, email, phone, topic, message, status, notes, handled_by, handled_at, created_at \
             FROM feedback_messages{} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
            where_sql,
            binds.len() + 1,
            binds.len() + 2,
        );
        let mut q = sqlx::query(&data_sql);
        for b in &binds {
            q = q.bind(b);
        }
        q = q.bind(limit).bind(offset);
        let rows = q.fetch_all(&self.pool).await?;
        let data: Vec<AdminFeedback> = rows
            .iter()
            .map(|r| AdminFeedback {
                id: r.try_get("id").unwrap(),
                name: r.try_get("name").ok().flatten(),
                email: r.try_get("email").ok().flatten(),
                phone: r.try_get("phone").ok().flatten(),
                topic: r.try_get("topic").ok().flatten(),
                message: r.try_get("message").unwrap_or_default(),
                status: r.try_get("status").unwrap_or_default(),
                notes: r.try_get("notes").ok().flatten(),
                handled_by: r.try_get("handled_by").ok().flatten(),
                handled_at: r.try_get("handled_at").ok().flatten(),
                created_at: r.try_get("created_at").unwrap(),
            })
            .collect();

        let count_sql = format!("SELECT COUNT(*) FROM feedback_messages{}", where_sql);
        let mut cq = sqlx::query_as::<_, (i64,)>(&count_sql);
        for b in &binds {
            cq = cq.bind(b);
        }
        let total = cq.fetch_one(&self.pool).await?.0;
        let total_pages = if limit == 0 { 0 } else { (total + limit - 1) / limit };

        Ok(Paginated {
            data,
            pagination: Pagination { page, limit, total, total_pages },
        })
    }

    pub async fn update_feedback(
        &self,
        id: Uuid,
        admin_id: Uuid,
        payload: UpdateFeedbackRequest,
    ) -> AppResult<AdminFeedback> {
        if let Some(status) = payload.status.as_deref() {
            sqlx::query(
                "UPDATE feedback_messages SET status = $2, handled_by = CASE WHEN $2 = 'new' THEN NULL ELSE $3 END, \
                                              handled_at = CASE WHEN $2 = 'new' THEN NULL ELSE NOW() END WHERE id = $1",
            )
            .bind(id)
            .bind(status)
            .bind(admin_id)
            .execute(&self.pool)
            .await?;
        }
        if let Some(notes) = payload.notes.as_deref() {
            sqlx::query("UPDATE feedback_messages SET notes = $2 WHERE id = $1")
                .bind(id)
                .bind(notes)
                .execute(&self.pool)
                .await?;
        }
        self.get_feedback(id).await
    }

    pub async fn get_feedback(&self, id: Uuid) -> AppResult<AdminFeedback> {
        let row = sqlx::query(
            "SELECT id, name, email, phone, topic, message, status, notes, handled_by, handled_at, created_at \
             FROM feedback_messages WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;
        Ok(AdminFeedback {
            id: row.try_get("id")?,
            name: row.try_get("name").ok().flatten(),
            email: row.try_get("email").ok().flatten(),
            phone: row.try_get("phone").ok().flatten(),
            topic: row.try_get("topic").ok().flatten(),
            message: row.try_get("message")?,
            status: row.try_get("status")?,
            notes: row.try_get("notes").ok().flatten(),
            handled_by: row.try_get("handled_by").ok().flatten(),
            handled_at: row.try_get("handled_at").ok().flatten(),
            created_at: row.try_get("created_at")?,
        })
    }

    pub async fn create_feedback(
        &self,
        p: CreateFeedbackRequest,
        ip: Option<String>,
        ua: Option<String>,
    ) -> AppResult<AdminFeedback> {
        let message = p.message.trim();
        if message.len() < 10 {
            return Err(AppError::Validation("сообщение слишком короткое".into()));
        }
        if message.len() > 4000 {
            return Err(AppError::Validation("сообщение слишком длинное".into()));
        }
        if let Some(email) = p.email.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            if !email.contains('@') || email.len() > 255 {
                return Err(AppError::Validation("некорректный email".into()));
            }
        }

        let row = sqlx::query(
            "INSERT INTO feedback_messages (name, email, phone, topic, message, ip, user_agent) \
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        )
        .bind(p.name.as_deref().map(str::trim))
        .bind(p.email.as_deref().map(str::trim))
        .bind(p.phone.as_deref().map(str::trim))
        .bind(p.topic.as_deref())
        .bind(message)
        .bind(ip)
        .bind(ua)
        .fetch_one(&self.pool)
        .await?;
        let id: Uuid = row.try_get("id")?;
        self.get_feedback(id).await
    }

    // ===== Users =====
    pub async fn list_users(&self, f: UserFilters) -> AppResult<Paginated<AdminUserListItem>> {
        let limit = f.limit.unwrap_or(20).clamp(1, 100);
        let page = f.page.unwrap_or(1).max(1);
        let offset = (page - 1) * limit;
        let mut where_sql = String::from(" WHERE u.deleted_at IS NULL");
        let mut binds: Vec<serde_json::Value> = Vec::new();
        let mut idx = 0;

        if let Some(role) = f.role.as_deref().filter(|s| !s.is_empty() && *s != "all") {
            idx += 1;
            where_sql.push_str(&format!(" AND ${} = ANY(u.roles)", idx));
            binds.push(serde_json::Value::String(role.to_string()));
        }
        if let Some(b) = f.is_blocked {
            idx += 1;
            where_sql.push_str(&format!(" AND u.is_blocked = ${}", idx));
            binds.push(serde_json::Value::Bool(b));
        }
        let q_text = f.q.as_deref().filter(|s| !s.trim().is_empty()).map(|s| s.to_string());
        if let Some(qt) = &q_text {
            idx += 1;
            where_sql.push_str(&format!(
                " AND (u.email ILIKE ${i} OR u.name ILIKE ${i} OR u.surname ILIKE ${i} OR u.phone ILIKE ${i})",
                i = idx
            ));
            binds.push(serde_json::Value::String(format!(
                "%{}%",
                qt.replace('%', "\\%")
            )));
        }
        let sql = format!(
            "SELECT u.id, u.email, u.phone, u.name, u.surname, u.roles, u.is_blocked, u.email_verified, u.created_at, \
                    EXISTS (SELECT 1 FROM tutor_profiles tp WHERE tp.user_id = u.id) AS has_tutor \
             FROM users u{} ORDER BY u.created_at DESC LIMIT ${} OFFSET ${}",
            where_sql, idx + 1, idx + 2
        );
        let mut q = sqlx::query(&sql);
        for b in &binds {
            q = bind_json_value(q, b.clone());
        }
        q = q.bind(limit).bind(offset);
        let rows = q.fetch_all(&self.pool).await?;
        let data: Vec<AdminUserListItem> = rows
            .iter()
            .map(|r| AdminUserListItem {
                id: r.try_get("id").unwrap(),
                email: r.try_get("email").unwrap_or_default(),
                phone: r.try_get("phone").unwrap_or_default(),
                name: r.try_get("name").unwrap_or_default(),
                surname: r.try_get("surname").unwrap_or_default(),
                roles: r.try_get("roles").unwrap_or_default(),
                is_blocked: r.try_get("is_blocked").unwrap_or(false),
                email_verified: r.try_get("email_verified").unwrap_or(false),
                created_at: r.try_get("created_at").unwrap(),
                has_tutor_profile: r.try_get("has_tutor").unwrap_or(false),
            })
            .collect();

        let count_sql = format!("SELECT COUNT(*) FROM users u{}", where_sql);
        let mut cq = sqlx::query_as::<_, (i64,)>(&count_sql);
        for b in &binds {
            cq = bind_json_value_as(cq, b.clone());
        }
        let total = cq.fetch_one(&self.pool).await?.0;
        let total_pages = if limit == 0 { 0 } else { (total + limit - 1) / limit };
        Ok(Paginated {
            data,
            pagination: Pagination { page, limit, total, total_pages },
        })
    }

    pub async fn block_user(&self, id: Uuid) -> AppResult<()> {
        sqlx::query("UPDATE users SET is_blocked = TRUE WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn unblock_user(&self, id: Uuid) -> AppResult<()> {
        sqlx::query("UPDATE users SET is_blocked = FALSE WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn set_user_roles(&self, id: Uuid, roles: Vec<String>) -> AppResult<()> {
        sqlx::query("UPDATE users SET roles = $2::text[] WHERE id = $1")
            .bind(id)
            .bind(&roles)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete_user(&self, id: Uuid) -> AppResult<()> {
        let mut tx = self.pool.begin().await?;

        // Detach analytics tracking
        sqlx::query("UPDATE tutor_views SET user_id = NULL WHERE user_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE tutor_contact_clicks SET user_id = NULL WHERE user_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        // Nullable admin/handler references
        sqlx::query("UPDATE feedback_messages SET handled_by = NULL WHERE handled_by = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE admin_media SET uploaded_by = NULL WHERE uploaded_by = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        // Audit/moderation history have NOT NULL admin_id — wipe entries authored by this user
        sqlx::query("DELETE FROM admin_audit_log WHERE admin_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM tutor_moderation_history WHERE admin_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        // Finally remove the user; remaining FKs (tutor_profiles, auth_sessions,
        // password_reset_tokens, post_views, post_authors.user_id) are ON DELETE CASCADE or SET NULL.
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }

        tx.commit().await?;
        Ok(())
    }

    // ===== Settings =====
    pub async fn list_settings(&self) -> AppResult<Vec<SiteSetting>> {
        let rows = sqlx::query("SELECT key, value, updated_at FROM site_settings ORDER BY key")
            .fetch_all(&self.pool)
            .await?;
        Ok(rows
            .iter()
            .map(|r| SiteSetting {
                key: r.try_get("key").unwrap_or_default(),
                value: r.try_get("value").unwrap_or(serde_json::Value::Null),
                updated_at: r.try_get("updated_at").unwrap(),
            })
            .collect())
    }

    pub async fn update_setting(
        &self,
        key: &str,
        value: serde_json::Value,
    ) -> AppResult<SiteSetting> {
        sqlx::query(
            "INSERT INTO site_settings (key, value) VALUES ($1, $2) \
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
        )
        .bind(key)
        .bind(&value)
        .execute(&self.pool)
        .await?;
        let row = sqlx::query("SELECT key, value, updated_at FROM site_settings WHERE key = $1")
            .bind(key)
            .fetch_one(&self.pool)
            .await?;
        Ok(SiteSetting {
            key: row.try_get("key")?,
            value: row.try_get("value")?,
            updated_at: row.try_get("updated_at")?,
        })
    }

    // ===== Media =====
    pub async fn list_media(&self, page: i64, limit: i64) -> AppResult<Paginated<AdminMediaItem>> {
        let limit = limit.clamp(1, 100);
        let offset = (page.max(1) - 1) * limit;
        let rows = sqlx::query(
            "SELECT id, url, filename, mime_type, size_bytes, width, height, alt_text, created_at \
             FROM admin_media ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;
        let data: Vec<AdminMediaItem> = rows
            .iter()
            .map(|r| AdminMediaItem {
                id: r.try_get("id").unwrap(),
                url: r.try_get("url").unwrap_or_default(),
                filename: r.try_get("filename").ok().flatten(),
                mime_type: r.try_get("mime_type").ok().flatten(),
                size_bytes: r.try_get("size_bytes").ok().flatten(),
                width: r.try_get("width").ok().flatten(),
                height: r.try_get("height").ok().flatten(),
                alt_text: r.try_get("alt_text").ok().flatten(),
                created_at: r.try_get("created_at").unwrap(),
            })
            .collect();
        let total = sqlx::query_as::<_, (i64,)>("SELECT COUNT(*) FROM admin_media")
            .fetch_one(&self.pool)
            .await?
            .0;
        let total_pages = if limit == 0 { 0 } else { (total + limit - 1) / limit };
        Ok(Paginated {
            data,
            pagination: Pagination { page, limit, total, total_pages },
        })
    }

    pub async fn record_media(
        &self,
        admin_id: Uuid,
        url: String,
        filename: Option<String>,
        mime_type: Option<String>,
        size_bytes: Option<i64>,
    ) -> AppResult<AdminMediaItem> {
        let row = sqlx::query(
            "INSERT INTO admin_media (uploaded_by, url, filename, mime_type, size_bytes) \
             VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at",
        )
        .bind(admin_id)
        .bind(&url)
        .bind(filename.as_deref())
        .bind(mime_type.as_deref())
        .bind(size_bytes)
        .fetch_one(&self.pool)
        .await?;
        Ok(AdminMediaItem {
            id: row.try_get("id")?,
            url,
            filename,
            mime_type,
            size_bytes,
            width: None,
            height: None,
            alt_text: None,
            created_at: row.try_get("created_at")?,
        })
    }

    pub async fn delete_media(&self, id: Uuid) -> AppResult<()> {
        let res = sqlx::query("DELETE FROM admin_media WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    // ===== Bootstrap admin =====
    pub async fn ensure_default_admin(&self, email: &str, password: &str) -> AppResult<()> {
        let row = sqlx::query("SELECT id, roles FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await?;

        let hash = hash_password(password)
            .map_err(|e| AppError::Internal(format!("argon2 hash failed: {e}")))?;

        match row {
            Some(r) => {
                let roles: Vec<String> = r.try_get("roles").unwrap_or_default();
                let id: Uuid = r.try_get("id")?;
                let mut new_roles = roles.clone();
                if !roles.iter().any(|x| x == "admin") {
                    new_roles.push("admin".to_string());
                }
                // Re-sync the default admin: clear soft-delete, unblock, re-hash password,
                // ensure admin role. This makes ADMIN_EMAIL/ADMIN_PASSWORD env vars the
                // source of truth for the seeded administrator.
                sqlx::query(
                    "UPDATE users \
                     SET roles = $2::text[], \
                         password_hash = $3, \
                         deleted_at = NULL, \
                         is_blocked = FALSE \
                     WHERE id = $1",
                )
                .bind(id)
                .bind(&new_roles)
                .bind(&hash)
                .execute(&self.pool)
                .await?;
                tracing::info!(email, "ensured default admin user (revived + password synced)");
            }
            None => {
                sqlx::query(
                    "INSERT INTO users (email, phone, password_hash, name, surname, roles, locale, timezone, email_verified) \
                     VALUES ($1, $2, $3, 'Admin', 'Repka', ARRAY['admin']::TEXT[], 'ru', 'Asia/Bishkek', TRUE)",
                )
                .bind(email)
                .bind("+996555000001")
                .bind(&hash)
                .execute(&self.pool)
                .await?;
                tracing::info!(email, "seeded default admin user");
            }
        }
        Ok(())
    }
}

fn bind_json_value<'q>(
    q: sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments>,
    v: serde_json::Value,
) -> sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments> {
    match v {
        serde_json::Value::String(s) => q.bind(s),
        serde_json::Value::Bool(b) => q.bind(b),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                q.bind(i)
            } else if let Some(f) = n.as_f64() {
                q.bind(f)
            } else {
                q.bind(serde_json::Value::Number(n))
            }
        }
        serde_json::Value::Array(_) => {
            // Treat as TEXT[] when it's all strings
            if let serde_json::Value::Array(ref a) = v {
                let strs: Vec<String> = a
                    .iter()
                    .filter_map(|x| x.as_str().map(|s| s.to_string()))
                    .collect();
                if strs.len() == a.len() {
                    return q.bind(strs);
                }
            }
            q.bind(v)
        }
        other => q.bind(other),
    }
}

fn bind_json_value_as<'q, T>(
    q: sqlx::query::QueryAs<'q, sqlx::Postgres, T, sqlx::postgres::PgArguments>,
    v: serde_json::Value,
) -> sqlx::query::QueryAs<'q, sqlx::Postgres, T, sqlx::postgres::PgArguments> {
    match v {
        serde_json::Value::String(s) => q.bind(s),
        serde_json::Value::Bool(b) => q.bind(b),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                q.bind(i)
            } else if let Some(f) = n.as_f64() {
                q.bind(f)
            } else {
                q.bind(serde_json::Value::Number(n))
            }
        }
        other => q.bind(other),
    }
}
