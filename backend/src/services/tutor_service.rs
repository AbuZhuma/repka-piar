use std::sync::Arc;

use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::config::Config;
use crate::error::{AppError, AppResult};
use crate::models::city::City;
use crate::models::subject::Subject;
use crate::models::tutor::{
    ContactsRevealed, Education, TutorDocument, TutorLanguage, TutorListRow, TutorPrice,
    TutorProfile, TutorProfileFull, TutorProfilePublic, WorkExperience,
};
use crate::utils::contacts::{build_masked_from_fields, build_revealed};
use crate::utils::slugify::{generate_slug, unique_tutor_slug};

const MAX_LIMIT: i64 = 50;
const DEFAULT_LIMIT: i64 = 12;

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct TutorFilters {
    pub subject: Option<String>,
    pub goal: Option<String>,
    pub format: Option<String>,
    pub city: Option<String>,
    pub price_min: Option<i32>,
    pub price_max: Option<i32>,
    pub experience_min: Option<i32>,
    pub age_group: Option<String>,
    pub language: Option<String>,
    pub is_native: Option<bool>,
    pub q: Option<String>,
    pub sort: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, serde::Serialize)]
pub struct Pagination {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug, serde::Serialize)]
pub struct TutorListResponse {
    pub data: Vec<TutorProfilePublic>,
    pub pagination: Pagination,
}

#[derive(Debug, Deserialize)]
pub struct CreateProfileRequest {
    pub subject: Option<String>, // slug — для генерации slug-ссылки
    pub bio: Option<String>,
    pub short_bio: Option<String>,
    pub experience_years: Option<i32>,
    pub city_id: Option<Uuid>,
    pub price_per_60: Option<i32>,
    pub price_per_90: Option<i32>,
    pub trial_enabled: Option<bool>,
    pub is_native_speaker: Option<bool>,
    pub specializations: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub bio: Option<String>,
    pub short_bio: Option<String>,
    pub experience_years: Option<i32>,
    pub city_id: Option<Uuid>,
    pub address: Option<String>,
    pub student_districts: Option<Vec<String>>,
    pub schedule_text: Option<String>,
    pub is_native_speaker: Option<bool>,
    pub specializations: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateContactsRequest {
    pub phone: Option<String>,
    pub whatsapp: Option<String>,
    pub telegram: Option<String>,
    pub email: Option<String>,
    pub instagram: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePricesRequest {
    pub price_per_60: Option<i32>,
    pub price_per_90: Option<i32>,
    pub trial_enabled: Option<bool>,
    pub currency: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddEducationRequest {
    pub institution: String,
    pub specialty: Option<String>,
    pub year_start: Option<i32>,
    pub year_end: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct AddExperienceRequest {
    pub position: String,
    pub company: Option<String>,
    pub year_start: Option<i32>,
    pub year_end: Option<i32>,
}

pub struct TutorService {
    pub pool: PgPool,
    pub config: Arc<Config>,
}

impl TutorService {
    pub fn new(pool: PgPool, config: Arc<Config>) -> Self {
        Self { pool, config }
    }

    pub async fn search(&self, filters: TutorFilters) -> AppResult<TutorListResponse> {
        let limit = filters
            .limit
            .unwrap_or(DEFAULT_LIMIT)
            .clamp(1, MAX_LIMIT);
        let page = filters.page.unwrap_or(1).max(1);
        let offset = (page - 1) * limit;

        let mut data_q = QueryBuilder::<Postgres>::new(
            "SELECT \
                tp.id, tp.slug, u.name, u.surname, \
                tp.bio, tp.short_bio, tp.photo_url, tp.video_url, \
                tp.is_native_speaker, tp.experience_years, tp.specializations, \
                tp.address, tp.student_districts, tp.schedule_text, \
                tp.price_per_60, tp.price_per_90, tp.currency, tp.trial_enabled, \
                tp.contact_phone, tp.contact_whatsapp, tp.contact_telegram, \
                tp.contact_email, tp.contact_instagram, \
                tp.status, tp.verified, tp.badges, \
                tp.views_count, tp.rating, tp.reviews_count, \
                c.id AS city_id, c.slug AS city_slug, c.name_ru AS city_name_ru, \
                c.name_kg AS city_name_kg, c.name_en AS city_name_en, \
                c.timezone AS city_timezone, c.lat AS city_lat, c.lng AS city_lng \
             FROM tutor_profiles tp \
             JOIN users u ON tp.user_id = u.id \
             LEFT JOIN cities c ON tp.city_id = c.id \
             WHERE tp.status = 'active' AND tp.verified = TRUE",
        );
        Self::push_filters(&mut data_q, &filters);
        Self::push_order(&mut data_q, filters.sort.as_deref());
        data_q.push(" LIMIT ").push_bind(limit);
        data_q.push(" OFFSET ").push_bind(offset);

        let rows: Vec<TutorListRow> = data_q
            .build_query_as::<TutorListRow>()
            .fetch_all(&self.pool)
            .await?;

        let mut count_q = QueryBuilder::<Postgres>::new(
            "SELECT COUNT(*) FROM tutor_profiles tp \
             JOIN users u ON tp.user_id = u.id \
             LEFT JOIN cities c ON tp.city_id = c.id \
             WHERE tp.status = 'active' AND tp.verified = TRUE",
        );
        Self::push_filters(&mut count_q, &filters);
        let total: (i64,) = count_q
            .build_query_as::<(i64,)>()
            .fetch_one(&self.pool)
            .await?;
        let total = total.0;
        let total_pages = if limit == 0 {
            0
        } else {
            (total + limit - 1) / limit
        };

        Ok(TutorListResponse {
            data: rows.into_iter().map(row_to_public).collect(),
            pagination: Pagination {
                page,
                limit,
                total,
                total_pages,
            },
        })
    }

    fn push_filters(q: &mut QueryBuilder<'_, Postgres>, f: &TutorFilters) {
        if let Some(subject) = f.subject.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            let slugs: Vec<String> = subject.split(',').map(|s| s.trim().to_string()).collect();
            q.push(" AND EXISTS (SELECT 1 FROM tutor_subjects ts JOIN subjects s ON s.id = ts.subject_id WHERE ts.tutor_id = tp.id AND s.slug = ANY(");
            q.push_bind(slugs);
            q.push("))");
        }
        if let Some(city) = f.city.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            q.push(" AND c.slug = ").push_bind(city.to_string());
        }
        if let Some(min) = f.price_min {
            q.push(" AND tp.price_per_60 >= ").push_bind(min);
        }
        if let Some(max) = f.price_max {
            q.push(" AND tp.price_per_60 <= ").push_bind(max);
        }
        if let Some(min) = f.experience_min {
            q.push(" AND tp.experience_years >= ").push_bind(min);
        }
        if let Some(true) = f.is_native {
            q.push(" AND tp.is_native_speaker = TRUE");
        }
        if let Some(goals) = split_csv(f.goal.as_deref()) {
            q.push(" AND EXISTS (SELECT 1 FROM tutor_goals tg WHERE tg.tutor_id = tp.id AND tg.goal_id = ANY(");
            q.push_bind(goals);
            q.push("))");
        }
        if let Some(formats) = split_csv(f.format.as_deref()) {
            q.push(" AND EXISTS (SELECT 1 FROM tutor_formats tf WHERE tf.tutor_id = tp.id AND tf.format_id = ANY(");
            q.push_bind(formats);
            q.push("))");
        }
        if let Some(ags) = split_csv(f.age_group.as_deref()) {
            q.push(" AND EXISTS (SELECT 1 FROM tutor_age_groups tag WHERE tag.tutor_id = tp.id AND tag.age_group_id = ANY(");
            q.push_bind(ags);
            q.push("))");
        }
        if let Some(langs) = split_csv(f.language.as_deref()) {
            q.push(" AND EXISTS (SELECT 1 FROM tutor_languages tl WHERE tl.tutor_id = tp.id AND tl.language_code = ANY(");
            q.push_bind(langs);
            q.push("))");
        }
        if let Some(qs) = f.q.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            let pat = format!("%{}%", qs);
            q.push(" AND (tp.short_bio ILIKE ");
            q.push_bind(pat.clone());
            q.push(" OR tp.bio ILIKE ");
            q.push_bind(pat.clone());
            q.push(" OR u.name ILIKE ");
            q.push_bind(pat.clone());
            q.push(" OR u.surname ILIKE ");
            q.push_bind(pat);
            q.push(")");
        }
    }

    fn push_order(q: &mut QueryBuilder<'_, Postgres>, sort: Option<&str>) {
        match sort {
            Some("price_asc") => {
                q.push(" ORDER BY tp.price_per_60 ASC NULLS LAST, tp.created_at DESC");
            }
            Some("price_desc") => {
                q.push(" ORDER BY tp.price_per_60 DESC NULLS LAST, tp.created_at DESC");
            }
            Some("experience") => {
                q.push(" ORDER BY tp.experience_years DESC, tp.rating DESC NULLS LAST");
            }
            Some("new") => {
                q.push(" ORDER BY tp.created_at DESC");
            }
            _ => {
                q.push(
                    " ORDER BY tp.rating DESC NULLS LAST, tp.views_count DESC, tp.created_at DESC",
                );
            }
        }
    }

    pub async fn get_full_by_slug(&self, slug: &str) -> AppResult<TutorProfileFull> {
        let row: TutorListRow = sqlx::query_as::<_, TutorListRow>(
            "SELECT \
                tp.id, tp.slug, u.name, u.surname, \
                tp.bio, tp.short_bio, tp.photo_url, tp.video_url, \
                tp.is_native_speaker, tp.experience_years, tp.specializations, \
                tp.address, tp.student_districts, tp.schedule_text, \
                tp.price_per_60, tp.price_per_90, tp.currency, tp.trial_enabled, \
                tp.contact_phone, tp.contact_whatsapp, tp.contact_telegram, \
                tp.contact_email, tp.contact_instagram, \
                tp.status, tp.verified, tp.badges, \
                tp.views_count, tp.rating, tp.reviews_count, \
                c.id AS city_id, c.slug AS city_slug, c.name_ru AS city_name_ru, \
                c.name_kg AS city_name_kg, c.name_en AS city_name_en, \
                c.timezone AS city_timezone, c.lat AS city_lat, c.lng AS city_lng \
             FROM tutor_profiles tp \
             JOIN users u ON tp.user_id = u.id \
             LEFT JOIN cities c ON tp.city_id = c.id \
             WHERE tp.slug = $1",
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;

        let tutor_id = row.id;
        let public = row_to_public(row);

        let subjects = sqlx::query_as::<_, Subject>(
            "SELECT s.* FROM subjects s \
             JOIN tutor_subjects ts ON ts.subject_id = s.id \
             WHERE ts.tutor_id = $1 ORDER BY s.sort_order",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let goals: Vec<(String,)> = sqlx::query_as(
            "SELECT goal_id FROM tutor_goals WHERE tutor_id = $1",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let age_groups: Vec<(String,)> = sqlx::query_as(
            "SELECT age_group_id FROM tutor_age_groups WHERE tutor_id = $1",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let formats: Vec<(String,)> = sqlx::query_as(
            "SELECT format_id FROM tutor_formats WHERE tutor_id = $1",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let languages = sqlx::query_as::<_, TutorLanguage>(
            "SELECT language_code, level FROM tutor_languages WHERE tutor_id = $1",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let education = sqlx::query_as::<_, Education>(
            "SELECT id, institution, specialty, year_start, year_end \
             FROM tutor_education WHERE tutor_id = $1 ORDER BY sort_order, year_start DESC NULLS LAST",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let experience = sqlx::query_as::<_, WorkExperience>(
            "SELECT id, position, company, year_start, year_end \
             FROM tutor_experience WHERE tutor_id = $1 ORDER BY sort_order, year_start DESC NULLS LAST",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        let documents = sqlx::query_as::<_, TutorDocument>(
            "SELECT id, title, file_url, file_type, verified \
             FROM tutor_documents WHERE tutor_id = $1 ORDER BY created_at DESC",
        )
        .bind(tutor_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(TutorProfileFull {
            profile: public,
            subjects,
            goals: goals.into_iter().map(|t| t.0).collect(),
            age_groups: age_groups.into_iter().map(|t| t.0).collect(),
            formats: formats.into_iter().map(|t| t.0).collect(),
            languages,
            education,
            experience,
            documents,
        })
    }

    pub fn track_profile_view(
        &self,
        tutor_id: Uuid,
        user_id: Option<Uuid>,
        ip_hash: Option<String>,
        user_agent: Option<String>,
        referrer: Option<String>,
    ) {
        let pool = self.pool.clone();
        tokio::spawn(async move {
            let _ = sqlx::query(
                "UPDATE tutor_profiles SET views_count = views_count + 1 WHERE id = $1",
            )
            .bind(tutor_id)
            .execute(&pool)
            .await;
            let _ = sqlx::query(
                "INSERT INTO tutor_views (tutor_id, user_id, ip_hash, user_agent, referrer) \
                 VALUES ($1, $2, $3, $4, $5)",
            )
            .bind(tutor_id)
            .bind(user_id)
            .bind(ip_hash)
            .bind(user_agent)
            .bind(referrer)
            .execute(&pool)
            .await;
        });
    }

    pub async fn similar(&self, slug: &str, limit: i64) -> AppResult<Vec<TutorProfilePublic>> {
        let limit = limit.clamp(1, 24);
        let row: Option<(Uuid, Option<i32>)> = sqlx::query_as(
            "SELECT id, price_per_60 FROM tutor_profiles WHERE slug = $1",
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?;
        let (tutor_id, price) = row.ok_or(AppError::NotFound)?;
        let price = price.unwrap_or(0);
        let price_min = (price as f64 * 0.8) as i32;
        let price_max = (price as f64 * 1.2) as i32;

        let rows: Vec<TutorListRow> = sqlx::query_as::<_, TutorListRow>(
            "SELECT \
                tp.id, tp.slug, u.name, u.surname, \
                tp.bio, tp.short_bio, tp.photo_url, tp.video_url, \
                tp.is_native_speaker, tp.experience_years, tp.specializations, \
                tp.address, tp.student_districts, tp.schedule_text, \
                tp.price_per_60, tp.price_per_90, tp.currency, tp.trial_enabled, \
                tp.contact_phone, tp.contact_whatsapp, tp.contact_telegram, \
                tp.contact_email, tp.contact_instagram, \
                tp.status, tp.verified, tp.badges, \
                tp.views_count, tp.rating, tp.reviews_count, \
                c.id AS city_id, c.slug AS city_slug, c.name_ru AS city_name_ru, \
                c.name_kg AS city_name_kg, c.name_en AS city_name_en, \
                c.timezone AS city_timezone, c.lat AS city_lat, c.lng AS city_lng \
             FROM tutor_profiles tp \
             JOIN users u ON tp.user_id = u.id \
             LEFT JOIN cities c ON tp.city_id = c.id \
             WHERE tp.status = 'active' AND tp.verified = TRUE \
               AND tp.id <> $1 \
               AND (tp.price_per_60 BETWEEN $2 AND $3 OR tp.price_per_60 IS NULL) \
               AND EXISTS ( \
                  SELECT 1 FROM tutor_subjects a \
                  JOIN tutor_subjects b ON a.subject_id = b.subject_id \
                  WHERE a.tutor_id = tp.id AND b.tutor_id = $1 \
               ) \
             ORDER BY tp.rating DESC NULLS LAST, tp.views_count DESC \
             LIMIT $4",
        )
        .bind(tutor_id)
        .bind(price_min)
        .bind(price_max)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(row_to_public).collect())
    }

    pub async fn create_my_profile(
        &self,
        user_id: Uuid,
        payload: CreateProfileRequest,
    ) -> AppResult<TutorProfile> {
        let exists: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM tutor_profiles WHERE user_id = $1")
                .bind(user_id)
                .fetch_optional(&self.pool)
                .await?;
        if exists.is_some() {
            return Err(AppError::Conflict("profile already exists".into()));
        }

        let user: (String, String) = sqlx::query_as("SELECT name, surname FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(&self.pool)
            .await?;
        let base = generate_slug(&user.0, &user.1, payload.subject.as_deref());
        let slug = unique_tutor_slug(&self.pool, &base).await?;

        let specializations = payload.specializations.unwrap_or_default();
        let experience_years = payload.experience_years.unwrap_or(0);
        let trial_enabled = payload.trial_enabled.unwrap_or(false);
        let is_native_speaker = payload.is_native_speaker.unwrap_or(false);

        let profile: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "INSERT INTO tutor_profiles ( \
                user_id, slug, bio, short_bio, experience_years, city_id, \
                price_per_60, price_per_90, trial_enabled, is_native_speaker, specializations \
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) \
             RETURNING *",
        )
        .bind(user_id)
        .bind(&slug)
        .bind(&payload.bio)
        .bind(&payload.short_bio)
        .bind(experience_years)
        .bind(payload.city_id)
        .bind(payload.price_per_60)
        .bind(payload.price_per_90)
        .bind(trial_enabled)
        .bind(is_native_speaker)
        .bind(&specializations)
        .fetch_one(&self.pool)
        .await?;

        Ok(profile)
    }

    pub async fn get_my_profile_full(
        &self,
        user_id: Uuid,
    ) -> AppResult<MyProfileFull> {
        let profile: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "SELECT * FROM tutor_profiles WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;

        let user: (String, String) = sqlx::query_as("SELECT name, surname FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(&self.pool)
            .await?;

        let city = if let Some(city_id) = profile.city_id {
            sqlx::query_as::<_, City>("SELECT * FROM cities WHERE id = $1")
                .bind(city_id)
                .fetch_optional(&self.pool)
                .await?
        } else {
            None
        };

        let revealed = build_revealed(&profile);

        Ok(MyProfileFull {
            profile,
            name: user.0,
            surname: user.1,
            city,
            contacts: revealed,
        })
    }

    pub async fn update_my_profile(
        &self,
        user_id: Uuid,
        payload: UpdateProfileRequest,
    ) -> AppResult<TutorProfile> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let updated: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "UPDATE tutor_profiles SET \
                bio = COALESCE($2, bio), \
                short_bio = COALESCE($3, short_bio), \
                experience_years = COALESCE($4, experience_years), \
                city_id = COALESCE($5, city_id), \
                address = COALESCE($6, address), \
                student_districts = COALESCE($7, student_districts), \
                schedule_text = COALESCE($8, schedule_text), \
                is_native_speaker = COALESCE($9, is_native_speaker), \
                specializations = COALESCE($10, specializations) \
             WHERE id = $1 RETURNING *",
        )
        .bind(profile.id)
        .bind(payload.bio)
        .bind(payload.short_bio)
        .bind(payload.experience_years)
        .bind(payload.city_id)
        .bind(payload.address)
        .bind(payload.student_districts)
        .bind(payload.schedule_text)
        .bind(payload.is_native_speaker)
        .bind(payload.specializations)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    pub async fn update_my_contacts(
        &self,
        user_id: Uuid,
        payload: UpdateContactsRequest,
    ) -> AppResult<TutorProfile> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let updated: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "UPDATE tutor_profiles SET \
                contact_phone = $2, contact_whatsapp = $3, contact_telegram = $4, \
                contact_email = $5, contact_instagram = $6 \
             WHERE id = $1 RETURNING *",
        )
        .bind(profile.id)
        .bind(payload.phone)
        .bind(payload.whatsapp)
        .bind(payload.telegram)
        .bind(payload.email)
        .bind(payload.instagram)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    pub async fn update_my_prices(
        &self,
        user_id: Uuid,
        payload: UpdatePricesRequest,
    ) -> AppResult<TutorProfile> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let updated: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "UPDATE tutor_profiles SET \
                price_per_60 = COALESCE($2, price_per_60), \
                price_per_90 = COALESCE($3, price_per_90), \
                trial_enabled = COALESCE($4, trial_enabled), \
                currency = COALESCE($5, currency) \
             WHERE id = $1 RETURNING *",
        )
        .bind(profile.id)
        .bind(payload.price_per_60)
        .bind(payload.price_per_90)
        .bind(payload.trial_enabled)
        .bind(payload.currency)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    pub async fn add_education(
        &self,
        user_id: Uuid,
        payload: AddEducationRequest,
    ) -> AppResult<Education> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let row: Education = sqlx::query_as::<_, Education>(
            "INSERT INTO tutor_education (tutor_id, institution, specialty, year_start, year_end) \
             VALUES ($1, $2, $3, $4, $5) \
             RETURNING id, institution, specialty, year_start, year_end",
        )
        .bind(profile.id)
        .bind(payload.institution)
        .bind(payload.specialty)
        .bind(payload.year_start)
        .bind(payload.year_end)
        .fetch_one(&self.pool)
        .await?;
        Ok(row)
    }

    pub async fn delete_education(&self, user_id: Uuid, edu_id: Uuid) -> AppResult<()> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let res = sqlx::query("DELETE FROM tutor_education WHERE id = $1 AND tutor_id = $2")
            .bind(edu_id)
            .bind(profile.id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    pub async fn add_experience(
        &self,
        user_id: Uuid,
        payload: AddExperienceRequest,
    ) -> AppResult<WorkExperience> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let row: WorkExperience = sqlx::query_as::<_, WorkExperience>(
            "INSERT INTO tutor_experience (tutor_id, position, company, year_start, year_end) \
             VALUES ($1, $2, $3, $4, $5) \
             RETURNING id, position, company, year_start, year_end",
        )
        .bind(profile.id)
        .bind(payload.position)
        .bind(payload.company)
        .bind(payload.year_start)
        .bind(payload.year_end)
        .fetch_one(&self.pool)
        .await?;
        Ok(row)
    }

    pub async fn delete_experience(&self, user_id: Uuid, exp_id: Uuid) -> AppResult<()> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let res = sqlx::query("DELETE FROM tutor_experience WHERE id = $1 AND tutor_id = $2")
            .bind(exp_id)
            .bind(profile.id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    pub async fn set_photo(&self, user_id: Uuid, url: &str) -> AppResult<TutorProfile> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let updated: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "UPDATE tutor_profiles SET photo_url = $2 WHERE id = $1 RETURNING *",
        )
        .bind(profile.id)
        .bind(url)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    pub async fn add_document(
        &self,
        user_id: Uuid,
        title: Option<String>,
        file_url: String,
        file_type: Option<String>,
    ) -> AppResult<TutorDocument> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let row: TutorDocument = sqlx::query_as::<_, TutorDocument>(
            "INSERT INTO tutor_documents (tutor_id, title, file_url, file_type) \
             VALUES ($1, $2, $3, $4) \
             RETURNING id, title, file_url, file_type, verified",
        )
        .bind(profile.id)
        .bind(title)
        .bind(file_url)
        .bind(file_type)
        .fetch_one(&self.pool)
        .await?;
        Ok(row)
    }

    pub async fn delete_document(&self, user_id: Uuid, doc_id: Uuid) -> AppResult<()> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        let res = sqlx::query("DELETE FROM tutor_documents WHERE id = $1 AND tutor_id = $2")
            .bind(doc_id)
            .bind(profile.id)
            .execute(&self.pool)
            .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    pub async fn submit_for_review(&self, user_id: Uuid) -> AppResult<TutorProfile> {
        let profile = self.must_get_profile_by_user(user_id).await?;
        if profile.status != "pending" && profile.status != "rejected" {
            return Err(AppError::Conflict(format!(
                "cannot submit profile in status '{}'",
                profile.status
            )));
        }
        let updated: TutorProfile = sqlx::query_as::<_, TutorProfile>(
            "UPDATE tutor_profiles SET status = 'pending_review', rejection_reason = NULL \
             WHERE id = $1 RETURNING *",
        )
        .bind(profile.id)
        .fetch_one(&self.pool)
        .await?;
        tracing::info!(tutor_id = %profile.id, "tutor profile submitted for review");
        Ok(updated)
    }

    async fn must_get_profile_by_user(&self, user_id: Uuid) -> AppResult<TutorProfile> {
        sqlx::query_as::<_, TutorProfile>("SELECT * FROM tutor_profiles WHERE user_id = $1")
            .bind(user_id)
            .fetch_optional(&self.pool)
            .await?
            .ok_or(AppError::NotFound)
    }
}

#[derive(Debug, serde::Serialize)]
pub struct MyProfileFull {
    #[serde(flatten)]
    pub profile: TutorProfile,
    pub name: String,
    pub surname: String,
    pub city: Option<City>,
    pub contacts: ContactsRevealed,
}

pub fn row_to_public(r: TutorListRow) -> TutorProfilePublic {
    let city = r.city_id.map(|id| City {
        id,
        slug: r.city_slug.unwrap_or_default(),
        name_ru: r.city_name_ru.unwrap_or_default(),
        name_kg: r.city_name_kg,
        name_en: r.city_name_en,
        timezone: r.city_timezone.unwrap_or_else(|| "Asia/Bishkek".to_string()),
        lat: r.city_lat,
        lng: r.city_lng,
    });
    TutorProfilePublic {
        id: r.id,
        slug: r.slug,
        name: r.name,
        surname: r.surname,
        bio: r.bio,
        short_bio: r.short_bio,
        photo_url: r.photo_url,
        video_url: r.video_url,
        is_native_speaker: r.is_native_speaker,
        experience_years: r.experience_years,
        specializations: r.specializations,
        city,
        address: r.address,
        student_districts: r.student_districts,
        schedule_text: r.schedule_text,
        price: TutorPrice {
            per_60: r.price_per_60,
            per_90: r.price_per_90,
            currency: r.currency,
            trial_enabled: r.trial_enabled,
        },
        contacts_masked: build_masked_from_fields(
            r.contact_phone.as_deref(),
            r.contact_whatsapp.as_deref(),
            r.contact_telegram.as_deref(),
            r.contact_email.as_deref(),
            r.contact_instagram.as_deref(),
        ),
        status: r.status,
        verified: r.verified,
        badges: r.badges,
        views_count: r.views_count,
        rating: r.rating.and_then(|d| d.to_f64()),
        reviews_count: r.reviews_count,
    }
}

fn split_csv(value: Option<&str>) -> Option<Vec<String>> {
    let value = value?.trim();
    if value.is_empty() {
        return None;
    }
    let parts: Vec<String> = value
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if parts.is_empty() {
        None
    } else {
        Some(parts)
    }
}
