use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{AdminAuthor, AdminService, AuthorRequest};
use crate::services::cache_keys;
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<Vec<AdminAuthor>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_authors().await?))
}

pub async fn create(
    State(state): State<AppState>,
    admin: AdminUser,
    Json(payload): Json<AuthorRequest>,
) -> AppResult<Json<AdminAuthor>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let a = svc.create_author(payload).await?;
    svc.log_action(admin.0.sub, "author.created", Some("author"), Some(a.id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(a))
}

pub async fn update(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<AuthorRequest>,
) -> AppResult<Json<AdminAuthor>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let a = svc.update_author(id, payload).await?;
    svc.log_action(admin.0.sub, "author.updated", Some("author"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(a))
}

pub async fn delete_author(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_author(id).await?;
    svc.log_action(admin.0.sub, "author.deleted", Some("author"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}
