//! Tutor reviews — public list/aggregate + authenticated create/update/delete.

use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::{AppError, AppResult};
use crate::services::cache_keys;
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct ReviewItem {
    pub id: Uuid,
    pub rating: i16,
    pub text: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub author: ReviewAuthor,
    pub is_mine: bool,
}

#[derive(Debug, Serialize)]
pub struct ReviewAuthor {
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ReviewsResponse {
    pub items: Vec<ReviewItem>,
    pub avg_rating: Option<f64>,
    pub count: i64,
    pub distribution: [i64; 5],
    /// my_review.is_some() if the caller has already left a review.
    pub my_review: Option<ReviewItem>,
}

pub async fn list(
    State(state): State<AppState>,
    auth: Option<AuthUser>,
    Path(slug): Path<String>,
) -> AppResult<Json<ReviewsResponse>> {
    let tutor_id: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM tutor_profiles WHERE slug = $1")
            .bind(&slug)
            .fetch_optional(&state.pool)
            .await?;
    let tutor_id = tutor_id.ok_or(AppError::NotFound)?.0;
    let my_user_id = auth.as_ref().map(|a| a.0.sub);

    let rows = sqlx::query_as::<
        _,
        (
            Uuid,                                    // review id
            Uuid,                                    // user id
            i16,                                     // rating
            Option<String>,                          // text
            chrono::DateTime<chrono::Utc>,           // created_at
            chrono::DateTime<chrono::Utc>,           // updated_at
            String,                                  // author name
            String,                                  // author surname
            Option<String>,                          // author avatar_url
        ),
    >(
        "SELECT r.id, r.user_id, r.rating, r.text, r.created_at, r.updated_at, \
                u.name, u.surname, u.avatar_url \
         FROM tutor_reviews r \
         JOIN users u ON u.id = r.user_id \
         WHERE r.tutor_id = $1 AND r.is_hidden = FALSE \
         ORDER BY r.created_at DESC",
    )
    .bind(tutor_id)
    .fetch_all(&state.pool)
    .await?;

    let mut items: Vec<ReviewItem> = Vec::with_capacity(rows.len());
    let mut my_review: Option<ReviewItem> = None;
    let mut total: i64 = 0;
    let mut sum: i64 = 0;
    let mut dist = [0i64; 5];
    for (id, uid, rating, text, created, updated, name, surname, avatar) in rows {
        let is_mine = my_user_id == Some(uid);
        let item = ReviewItem {
            id,
            rating,
            text,
            created_at: created,
            updated_at: updated,
            author: ReviewAuthor {
                name: format!("{} {}", name.trim(), surname.trim()).trim().to_string(),
                avatar_url: avatar,
            },
            is_mine,
        };
        if is_mine {
            my_review = Some(ReviewItem { ..clone_item(&item) });
        }
        total += 1;
        sum += rating as i64;
        let idx = (rating - 1).clamp(0, 4) as usize;
        dist[idx] += 1;
        items.push(item);
    }
    let avg = if total > 0 {
        Some(((sum as f64) / (total as f64) * 10.0).round() / 10.0)
    } else {
        None
    };

    Ok(Json(ReviewsResponse {
        items,
        avg_rating: avg,
        count: total,
        distribution: dist,
        my_review,
    }))
}

fn clone_item(it: &ReviewItem) -> ReviewItem {
    ReviewItem {
        id: it.id,
        rating: it.rating,
        text: it.text.clone(),
        created_at: it.created_at,
        updated_at: it.updated_at,
        author: ReviewAuthor {
            name: it.author.name.clone(),
            avatar_url: it.author.avatar_url.clone(),
        },
        is_mine: it.is_mine,
    }
}

#[derive(Debug, Deserialize)]
pub struct UpsertReviewRequest {
    pub rating: i16,
    pub text: Option<String>,
}

pub async fn upsert(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(slug): Path<String>,
    Json(payload): Json<UpsertReviewRequest>,
) -> AppResult<Json<Value>> {
    if !(1..=5).contains(&payload.rating) {
        return Err(AppError::Validation("rating must be between 1 and 5".into()));
    }
    let text = payload
        .text
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    if let Some(ref t) = text {
        if t.chars().count() > 4000 {
            return Err(AppError::Validation("text too long (max 4000 chars)".into()));
        }
    }
    let tutor_row: Option<(Uuid, Uuid)> =
        sqlx::query_as("SELECT id, user_id FROM tutor_profiles WHERE slug = $1")
            .bind(&slug)
            .fetch_optional(&state.pool)
            .await?;
    let (tutor_id, tutor_user) = tutor_row.ok_or(AppError::NotFound)?;
    if tutor_user == auth.0.sub {
        return Err(AppError::Validation(
            "you can't review your own profile".into(),
        ));
    }

    sqlx::query(
        "INSERT INTO tutor_reviews (tutor_id, user_id, rating, text) \
         VALUES ($1, $2, $3, $4) \
         ON CONFLICT (tutor_id, user_id) DO UPDATE \
           SET rating = EXCLUDED.rating, text = EXCLUDED.text",
    )
    .bind(tutor_id)
    .bind(auth.0.sub)
    .bind(payload.rating)
    .bind(text)
    .execute(&state.pool)
    .await?;

    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn delete_mine(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(slug): Path<String>,
) -> AppResult<Json<Value>> {
    let tutor_id: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM tutor_profiles WHERE slug = $1")
            .bind(&slug)
            .fetch_optional(&state.pool)
            .await?;
    let tutor_id = tutor_id.ok_or(AppError::NotFound)?.0;
    sqlx::query("DELETE FROM tutor_reviews WHERE tutor_id = $1 AND user_id = $2")
        .bind(tutor_id)
        .bind(auth.0.sub)
        .execute(&state.pool)
        .await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}
