use std::net::SocketAddr;

use axum::{
    extract::{ConnectInfo, Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde_json::{json, Value};

use crate::error::AppResult;
use crate::models::post::{PostCategoryView, PostFilters, PostFull, PostListItem};
use crate::services::post_service::{PostListResponse, PostService};
use crate::AppState;

fn extract_locale(headers: &HeaderMap, q: Option<&str>) -> Option<String> {
    if let Some(loc) = q {
        let trimmed = loc.trim().to_lowercase();
        if !trimmed.is_empty() {
            return Some(trimmed);
        }
    }
    headers
        .get(axum::http::header::ACCEPT_LANGUAGE)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next().map(|s| s.trim().to_lowercase()))
        .map(|s| {
            if s.starts_with("ky") || s.starts_with("kg") {
                "kg".to_string()
            } else if s.starts_with("en") {
                "en".to_string()
            } else {
                "ru".to_string()
            }
        })
}

fn extract_referrer(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::REFERER)
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

fn ip_hash(ip: &str) -> String {
    use base64::Engine;
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    ip.hash(&mut hasher);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hasher.finish().to_le_bytes())
}

pub async fn list(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(mut filters): Query<PostFilters>,
) -> AppResult<Json<PostListResponse>> {
    if filters.locale.is_none() {
        filters.locale = extract_locale(&headers, None);
    }
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.search(filters).await?))
}

pub async fn featured(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<LocaleQuery>,
) -> AppResult<Json<Option<PostListItem>>> {
    let loc = extract_locale(&headers, q.locale.as_deref());
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.featured(loc.as_deref()).await?))
}

pub async fn categories(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<LocaleQuery>,
) -> AppResult<Json<Vec<PostCategoryView>>> {
    let loc = extract_locale(&headers, q.locale.as_deref());
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_categories(loc.as_deref()).await?))
}

pub async fn get_by_slug(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Path(slug): Path<String>,
    Query(q): Query<LocaleQuery>,
) -> AppResult<Json<PostFull>> {
    let loc = extract_locale(&headers, q.locale.as_deref());
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    let post = svc.get_by_slug(&slug, loc.as_deref()).await?;

    let ip = extract_ip(&headers, &addr);
    svc.track_view(post.id, None, Some(ip_hash(&ip)), extract_referrer(&headers))
        .await;

    Ok(Json(post))
}

pub async fn related(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
    Query(q): Query<LocaleQuery>,
) -> AppResult<Json<Vec<PostListItem>>> {
    let loc = extract_locale(&headers, q.locale.as_deref())
        .unwrap_or_else(|| "ru".to_string());
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    let post = svc.get_by_slug(&slug, Some(&loc)).await?;
    let items = svc.related_for(post.id, 3, &loc).await?;
    Ok(Json(items))
}

pub async fn like(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> AppResult<Json<Value>> {
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    let likes = svc.like(&slug).await?;
    Ok(Json(json!({ "likes_count": likes })))
}

#[derive(Debug, serde::Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(default)]
    pub locale: Option<String>,
    #[serde(default)]
    pub page: Option<i64>,
    #[serde(default)]
    pub limit: Option<i64>,
}

pub async fn search(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<SearchQuery>,
) -> AppResult<Json<PostListResponse>> {
    let svc = PostService::new(state.pool.clone(), state.config.clone());
    let filters = PostFilters {
        category: None,
        tag: None,
        q: Some(q.q),
        featured: None,
        locale: q
            .locale
            .clone()
            .or_else(|| extract_locale(&headers, None)),
        page: q.page,
        limit: q.limit,
    };
    Ok(Json(svc.search(filters).await?))
}

#[derive(Debug, serde::Deserialize)]
pub struct LocaleQuery {
    pub locale: Option<String>,
}
