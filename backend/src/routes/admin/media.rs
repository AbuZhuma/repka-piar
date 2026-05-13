use std::path::PathBuf;

use axum::{
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::{AppError, AppResult};
use crate::services::admin_service::{AdminMediaItem, AdminService, Paginated};
use crate::AppState;

pub const MAX_MEDIA_SIZE: usize = 20 * 1024 * 1024;

const IMAGE_MIMES: &[&str] = &["image/jpeg", "image/png", "image/webp", "image/gif"];

pub fn media_body_limit() -> DefaultBodyLimit {
    DefaultBodyLimit::max(MAX_MEDIA_SIZE)
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Paginated<AdminMediaItem>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_media(q.page.unwrap_or(1), q.limit.unwrap_or(40)).await?))
}

pub async fn upload(
    State(state): State<AppState>,
    admin: AdminUser,
    mut multipart: Multipart,
) -> AppResult<Json<AdminMediaItem>> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::Validation(format!("multipart parse error: {e}")))?
    {
        if field.name() == Some("file") {
            let filename = field.file_name().map(String::from);
            let content_type = field.content_type().map(String::from);
            let bytes = field
                .bytes()
                .await
                .map_err(|e| AppError::Validation(format!("file read error: {e}")))?;
            if bytes.len() > MAX_MEDIA_SIZE {
                return Err(AppError::Validation(format!(
                    "file too large: max {} bytes",
                    MAX_MEDIA_SIZE
                )));
            }
            let mime = detect_mime(content_type.as_deref(), filename.as_deref());
            if !IMAGE_MIMES.contains(&mime.as_str()) {
                return Err(AppError::Validation(format!(
                    "unsupported media type: {mime}"
                )));
            }
            let ext = mime_to_ext(&mime).unwrap_or("bin");
            let url = save_upload(&state.upload_dir, "media", ext, &bytes).await?;

            let svc = AdminService::new(state.pool.clone(), state.config.clone());
            let item = svc
                .record_media(
                    admin.0.sub,
                    url,
                    filename,
                    Some(mime),
                    Some(bytes.len() as i64),
                )
                .await?;
            return Ok(Json(item));
        }
    }
    Err(AppError::Validation("file field missing".into()))
}

pub async fn delete_media(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_media(id).await?;
    svc.log_action(admin.0.sub, "media.deleted", Some("media"), Some(id), None).await;
    Ok(Json(json!({ "ok": true })))
}

fn detect_mime(content_type: Option<&str>, filename: Option<&str>) -> String {
    if let Some(ct) = content_type {
        let ct = ct.split(';').next().unwrap_or(ct).trim().to_lowercase();
        if !ct.is_empty() && ct != "application/octet-stream" {
            return ct;
        }
    }
    if let Some(name) = filename {
        if let Some(guess) = mime_guess::from_path(name).first() {
            return guess.essence_str().to_string();
        }
    }
    "application/octet-stream".to_string()
}

fn mime_to_ext(mime: &str) -> Option<&'static str> {
    match mime {
        "image/jpeg" => Some("jpg"),
        "image/png" => Some("png"),
        "image/webp" => Some("webp"),
        "image/gif" => Some("gif"),
        _ => None,
    }
}

async fn save_upload(
    base: &PathBuf,
    subdir: &str,
    ext: &str,
    data: &[u8],
) -> AppResult<String> {
    let dir = base.join("admin").join(subdir);
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| AppError::Internal(format!("failed to create upload dir: {e}")))?;
    let filename = format!("{}.{}", Uuid::new_v4(), ext);
    let path = dir.join(&filename);
    tokio::fs::write(&path, data)
        .await
        .map_err(|e| AppError::Internal(format!("failed to write upload: {e}")))?;
    Ok(format!("/uploads/admin/{}/{}", subdir, filename))
}
