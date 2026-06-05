//! Authenticated user-scoped endpoints: avatar upload + favorites.
//! Public route prefix is `/api/me/*`.

use axum::{
    extract::{Multipart, Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::{AppError, AppResult};
use crate::routes::tutors::{detect_mime, mime_to_ext, save_upload, take_file_field, PHOTO_MIMES};
use crate::AppState;

const MAX_AVATAR_SIZE: usize = 5 * 1024 * 1024;

#[derive(Debug, Serialize)]
pub struct UploadedAvatar {
    pub url: String,
}

pub async fn upload_avatar(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> AppResult<Json<UploadedAvatar>> {
    let (filename, content_type, data) = take_file_field(&mut multipart, "file").await?;
    if data.len() > MAX_AVATAR_SIZE {
        return Err(AppError::Validation(format!(
            "avatar too large: max {MAX_AVATAR_SIZE} bytes"
        )));
    }
    let mime = detect_mime(content_type.as_deref(), filename.as_deref());
    if !PHOTO_MIMES.contains(&mime.as_str()) {
        return Err(AppError::Validation(format!(
            "unsupported avatar type: {mime} (allowed: {})",
            PHOTO_MIMES.join(", ")
        )));
    }
    let ext = mime_to_ext(&mime).unwrap_or("bin");
    let url = save_upload(&state.upload_dir, auth.0.sub, "avatars", ext, &data).await?;

    sqlx::query("UPDATE users SET avatar_url = $2 WHERE id = $1")
        .bind(auth.0.sub)
        .bind(&url)
        .execute(&state.pool)
        .await?;

    Ok(Json(UploadedAvatar { url }))
}

// --------------------------------------------------------------- Favorites

#[derive(Debug, Serialize)]
pub struct FavoriteTutor {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub surname: String,
    pub photo_url: Option<String>,
    pub price_per_60: Option<rust_decimal::Decimal>,
    pub currency: String,
    pub specializations: Vec<String>,
    pub rating: Option<rust_decimal::Decimal>,
    pub reviews_count: i32,
    pub trial_enabled: bool,
    pub added_at: chrono::DateTime<chrono::Utc>,
}

pub async fn list_favorites(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<Vec<FavoriteTutor>>> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            String,
            String,
            Option<String>,
            Option<rust_decimal::Decimal>,
            String,
            Vec<String>,
            Option<rust_decimal::Decimal>,
            i32,
            bool,
            chrono::DateTime<chrono::Utc>,
        ),
    >(
        "SELECT tp.id, tp.slug, u.name, u.surname, tp.photo_url, \
                tp.price_per_60, tp.currency, COALESCE(tp.specializations, ARRAY[]::TEXT[]), \
                tp.rating, tp.reviews_count, tp.trial_enabled, uf.created_at \
         FROM user_favorites uf \
         JOIN tutor_profiles tp ON tp.id = uf.tutor_id \
         JOIN users u ON u.id = tp.user_id \
         WHERE uf.user_id = $1 \
         ORDER BY uf.created_at DESC",
    )
    .bind(auth.0.sub)
    .fetch_all(&state.pool)
    .await?;

    let out: Vec<FavoriteTutor> = rows
        .into_iter()
        .map(
            |(id, slug, name, surname, photo, p60, cur, specs, rating, rc, trial, added)| {
                FavoriteTutor {
                    id,
                    slug,
                    name,
                    surname,
                    photo_url: photo,
                    price_per_60: p60,
                    currency: cur,
                    specializations: specs,
                    rating,
                    reviews_count: rc,
                    trial_enabled: trial,
                    added_at: added,
                }
            },
        )
        .collect();
    Ok(Json(out))
}

pub async fn add_favorite(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(tutor_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    sqlx::query(
        "INSERT INTO user_favorites (user_id, tutor_id) VALUES ($1, $2) \
         ON CONFLICT DO NOTHING",
    )
    .bind(auth.0.sub)
    .bind(tutor_id)
    .execute(&state.pool)
    .await?;
    Ok(Json(json!({ "ok": true })))
}

pub async fn remove_favorite(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(tutor_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM user_favorites WHERE user_id = $1 AND tutor_id = $2")
        .bind(auth.0.sub)
        .bind(tutor_id)
        .execute(&state.pool)
        .await?;
    Ok(Json(json!({ "ok": true })))
}

#[derive(Debug, Deserialize)]
pub struct SyncFavoritesRequest {
    pub tutor_ids: Vec<Uuid>,
}

/// Bulk-merge guest favorites (from localStorage) on first login.
/// Idempotent — ON CONFLICT DO NOTHING.
pub async fn sync_favorites(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<SyncFavoritesRequest>,
) -> AppResult<Json<Value>> {
    if payload.tutor_ids.is_empty() {
        return Ok(Json(json!({ "ok": true, "merged": 0 })));
    }
    let mut tx = state.pool.begin().await?;
    let mut merged = 0i64;
    for id in payload.tutor_ids.iter().take(500) {
        let res = sqlx::query(
            "INSERT INTO user_favorites (user_id, tutor_id) VALUES ($1, $2) \
             ON CONFLICT DO NOTHING",
        )
        .bind(auth.0.sub)
        .bind(id)
        .execute(&mut *tx)
        .await?;
        merged += res.rows_affected() as i64;
    }
    tx.commit().await?;
    Ok(Json(json!({ "ok": true, "merged": merged })))
}
