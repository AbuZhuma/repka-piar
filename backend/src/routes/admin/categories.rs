use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{AdminCategory, AdminService, CategoryRequest};
use crate::services::cache_keys;
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<Vec<AdminCategory>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_categories().await?))
}

pub async fn create(
    State(state): State<AppState>,
    admin: AdminUser,
    Json(payload): Json<CategoryRequest>,
) -> AppResult<Json<AdminCategory>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let cat = svc.create_category(payload).await?;
    svc.log_action(admin.0.sub, "category.created", Some("category"), Some(cat.id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(cat))
}

pub async fn update(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<CategoryRequest>,
) -> AppResult<Json<AdminCategory>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let cat = svc.update_category(id, payload).await?;
    svc.log_action(admin.0.sub, "category.updated", Some("category"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(cat))
}

pub async fn delete_category(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_category(id).await?;
    svc.log_action(admin.0.sub, "category.deleted", Some("category"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}
