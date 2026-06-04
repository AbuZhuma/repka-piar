use std::net::SocketAddr;
use std::path::PathBuf;

use axum::{
    extract::{ConnectInfo, DefaultBodyLimit, Multipart, Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::{AppError, AppResult};
use crate::services::cache_keys;
use crate::services::tutor_service::{
    AddEducationRequest, AddExperienceRequest, CreateProfileRequest, MyProfileFull, TutorFilters,
    TutorService, UpdateContactsRequest, UpdatePricesRequest, UpdateProfileRequest,
};
use crate::AppState;

pub const MAX_PHOTO_SIZE: usize = 5 * 1024 * 1024;
pub const MAX_DOC_SIZE: usize = 10 * 1024 * 1024;

const PHOTO_MIMES: &[&str] = &["image/jpeg", "image/png", "image/webp"];
const DOC_MIMES: &[&str] = &[
    "application/pdf",
    "image/jpeg",
    "image/png",
];

fn extract_user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

fn extract_ip(headers: &HeaderMap, addr: &SocketAddr) -> String {
    if let Some(v) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok()) {
        if let Some(first) = v.split(',').next() {
            return first.trim().to_string();
        }
    }
    if let Some(v) = headers.get("x-real-ip").and_then(|v| v.to_str().ok()) {
        return v.to_string();
    }
    addr.ip().to_string()
}

fn extract_referrer(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::REFERER)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

fn ip_hash(ip: &str) -> String {
    use base64::Engine;
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    ip.hash(&mut hasher);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hasher.finish().to_le_bytes())
}

fn to_value<T: serde::Serialize>(v: &T) -> AppResult<Value> {
    serde_json::to_value(v).map_err(|e| AppError::Internal(format!("serialize: {e}")))
}

pub async fn list(
    State(state): State<AppState>,
    Query(filters): Query<TutorFilters>,
) -> AppResult<Json<Value>> {
    let cache_key = cache_keys::tutor_list(&serde_json::to_string(&filters).unwrap_or_default());
    if let Some(cached) = state.cache.get::<Value>(&cache_key).await {
        return Ok(Json(cached));
    }
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    let res = svc.search(filters).await?;
    let value = to_value(&res)?;
    state
        .cache
        .set(&cache_key, &value, Some(cache_keys::TTL_TUTORS))
        .await;
    Ok(Json(value))
}

pub async fn get_by_slug(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Path(slug): Path<String>,
) -> AppResult<Json<Value>> {
    let cache_key = cache_keys::tutor_by_slug(&slug);
    let (tutor_id, value) =
        if let Some(cached) = state.cache.get::<Value>(&cache_key).await {
            let id = cached
                .get("profile")
                .and_then(|p| p.get("id"))
                .and_then(|v| v.as_str())
                .and_then(|s| Uuid::parse_str(s).ok());
            (id, cached)
        } else {
            let svc = TutorService::new(state.pool.clone(), state.config.clone());
            let full = svc.get_full_by_slug(&slug).await?;
            let id = full.profile.id;
            let value = to_value(&full)?;
            state
                .cache
                .set(&cache_key, &value, Some(cache_keys::TTL_TUTORS))
                .await;
            (Some(id), value)
        };

    // Fire-and-forget view tracking — counted even on cache hits.
    if let Some(id) = tutor_id {
        let svc = TutorService::new(state.pool.clone(), state.config.clone());
        let ip = extract_ip(&headers, &addr);
        svc.track_profile_view(
            id,
            None,
            Some(ip_hash(&ip)),
            extract_user_agent(&headers),
            extract_referrer(&headers),
        );
    }
    Ok(Json(value))
}

#[derive(serde::Deserialize)]
pub struct SimilarQuery {
    pub limit: Option<i64>,
}

pub async fn similar(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(q): Query<SimilarQuery>,
) -> AppResult<Json<Value>> {
    let limit = q.limit.unwrap_or(6);
    let cache_key = cache_keys::tutor_similar(&slug, limit as u32);
    if let Some(cached) = state.cache.get::<Value>(&cache_key).await {
        return Ok(Json(cached));
    }
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    let res = svc.similar(&slug, limit).await?;
    let value = to_value(&res)?;
    state
        .cache
        .set(&cache_key, &value, Some(cache_keys::TTL_TUTORS))
        .await;
    Ok(Json(value))
}

pub async fn create_me(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<CreateProfileRequest>,
) -> AppResult<Json<MyProfileFull>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.create_my_profile(auth.0.sub, payload).await?;
    let profile = svc.get_my_profile_full(auth.0.sub).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(profile))
}

pub async fn get_me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<MyProfileFull>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.get_my_profile_full(auth.0.sub).await?))
}

pub async fn update_me(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<UpdateProfileRequest>,
) -> AppResult<Json<MyProfileFull>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.update_my_profile(auth.0.sub, payload).await?;
    let profile = svc.get_my_profile_full(auth.0.sub).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(profile))
}

pub async fn update_contacts(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<UpdateContactsRequest>,
) -> AppResult<Json<MyProfileFull>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.update_my_contacts(auth.0.sub, payload).await?;
    let profile = svc.get_my_profile_full(auth.0.sub).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(profile))
}

pub async fn update_prices(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<UpdatePricesRequest>,
) -> AppResult<Json<MyProfileFull>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.update_my_prices(auth.0.sub, payload).await?;
    let profile = svc.get_my_profile_full(auth.0.sub).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(profile))
}

pub async fn add_education(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<AddEducationRequest>,
) -> AppResult<Json<Value>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    let row = svc.add_education(auth.0.sub, payload).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!(row)))
}

pub async fn delete_education(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.delete_education(auth.0.sub, id).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn add_experience(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<AddExperienceRequest>,
) -> AppResult<Json<Value>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    let row = svc.add_experience(auth.0.sub, payload).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!(row)))
}

pub async fn delete_experience(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.delete_experience(auth.0.sub, id).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn submit_for_review(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<Value>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    let updated = svc.submit_for_review(auth.0.sub).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true, "status": updated.status })))
}

pub async fn upload_photo(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> AppResult<Json<Value>> {
    let (filename, content_type, data) = take_file_field(&mut multipart, "file").await?;
    if data.len() > MAX_PHOTO_SIZE {
        return Err(AppError::Validation(format!(
            "file too large: max {} bytes",
            MAX_PHOTO_SIZE
        )));
    }
    let mime = detect_mime(content_type.as_deref(), filename.as_deref());
    if !PHOTO_MIMES.contains(&mime.as_str()) {
        return Err(AppError::Validation(format!(
            "unsupported photo type: {mime} (allowed: {})",
            PHOTO_MIMES.join(", ")
        )));
    }
    let ext = mime_to_ext(&mime).unwrap_or("bin");
    let url = save_upload(&state.upload_dir, auth.0.sub, "photos", ext, &data).await?;

    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.set_photo(auth.0.sub, &url).await?;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "url": url })))
}

pub async fn upload_document(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> AppResult<Json<Value>> {
    let mut title: Option<String> = None;
    let mut filename: Option<String> = None;
    let mut content_type: Option<String> = None;
    let mut data: Option<bytes::Bytes> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::Validation(format!("multipart parse error: {e}")))?
    {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "title" => {
                title = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::Validation(format!("invalid title: {e}")))?,
                );
            }
            "file" => {
                filename = field.file_name().map(String::from);
                content_type = field.content_type().map(String::from);
                let bytes = field
                    .bytes()
                    .await
                    .map_err(|e| AppError::Validation(format!("file read error: {e}")))?;
                data = Some(bytes);
            }
            _ => {
                let _ = field.bytes().await;
            }
        }
    }

    let data = data.ok_or_else(|| AppError::Validation("missing 'file' field".into()))?;
    if data.len() > MAX_DOC_SIZE {
        return Err(AppError::Validation(format!(
            "file too large: max {} bytes",
            MAX_DOC_SIZE
        )));
    }
    let mime = detect_mime(content_type.as_deref(), filename.as_deref());
    if !DOC_MIMES.contains(&mime.as_str()) {
        return Err(AppError::Validation(format!(
            "unsupported document type: {mime}"
        )));
    }
    let ext = mime_to_ext(&mime).unwrap_or("bin");
    let url = save_upload(&state.upload_dir, auth.0.sub, "documents", ext, &data).await?;

    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    let doc = svc
        .add_document(auth.0.sub, title, url, Some(mime))
        .await?;
    Ok(Json(json!(doc)))
}

pub async fn delete_document(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = TutorService::new(state.pool.clone(), state.config.clone());
    svc.delete_document(auth.0.sub, id).await?;
    Ok(Json(json!({ "ok": true })))
}

pub fn photo_body_limit() -> DefaultBodyLimit {
    DefaultBodyLimit::max(MAX_PHOTO_SIZE)
}

pub fn doc_body_limit() -> DefaultBodyLimit {
    DefaultBodyLimit::max(MAX_DOC_SIZE)
}

async fn take_file_field(
    multipart: &mut Multipart,
    field_name: &str,
) -> AppResult<(Option<String>, Option<String>, bytes::Bytes)> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::Validation(format!("multipart parse error: {e}")))?
    {
        if field.name() == Some(field_name) {
            let filename = field.file_name().map(String::from);
            let content_type = field.content_type().map(String::from);
            let bytes = field
                .bytes()
                .await
                .map_err(|e| AppError::Validation(format!("file read error: {e}")))?;
            return Ok((filename, content_type, bytes));
        }
    }
    Err(AppError::Validation(format!(
        "missing '{field_name}' field"
    )))
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
        "application/pdf" => Some("pdf"),
        _ => None,
    }
}

async fn save_upload(
    base: &PathBuf,
    user_id: Uuid,
    subdir: &str,
    ext: &str,
    data: &[u8],
) -> AppResult<String> {
    let dir = base.join(user_id.to_string()).join(subdir);
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| AppError::Internal(format!("failed to create upload dir: {e}")))?;
    let filename = format!("{}.{}", Uuid::new_v4(), ext);
    let path = dir.join(&filename);
    tokio::fs::write(&path, data)
        .await
        .map_err(|e| AppError::Internal(format!("failed to write upload: {e}")))?;
    Ok(format!("/uploads/{}/{}/{}", user_id, subdir, filename))
}
