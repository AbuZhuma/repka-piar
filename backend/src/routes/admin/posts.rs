use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{
    AdminPost, AdminPostListItem, AdminService, CreatePostRequest, Paginated, PostFilters,
    UpdatePostRequest,
};
use crate::services::cache_keys;
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(filters): Query<PostFilters>,
) -> AppResult<Json<Paginated<AdminPostListItem>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_posts(filters).await?))
}

pub async fn get(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AdminPost>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.get_post(id).await?))
}

pub async fn create(
    State(state): State<AppState>,
    admin: AdminUser,
    Json(payload): Json<CreatePostRequest>,
) -> AppResult<Json<AdminPost>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let post = svc.create_post(payload).await?;
    svc.log_action(admin.0.sub, "post.created", Some("post"), Some(post.id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(post))
}

pub async fn update(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdatePostRequest>,
) -> AppResult<Json<AdminPost>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let post = svc.update_post(id, payload).await?;
    svc.log_action(admin.0.sub, "post.updated", Some("post"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(post))
}

pub async fn publish(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AdminPost>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let post = svc.publish_post(id).await?;
    svc.log_action(admin.0.sub, "post.published", Some("post"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(post))
}

pub async fn unpublish(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AdminPost>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let post = svc.unpublish_post(id).await?;
    svc.log_action(admin.0.sub, "post.unpublished", Some("post"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(post))
}

pub async fn delete_post(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_post(id).await?;
    svc.log_action(admin.0.sub, "post.deleted", Some("post"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn duplicate(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AdminPost>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let post = svc.duplicate_post(id).await?;
    svc.log_action(admin.0.sub, "post.duplicated", Some("post"), Some(id), None).await;
    cache_keys::purge_posts(&state.cache).await;
    Ok(Json(post))
}
