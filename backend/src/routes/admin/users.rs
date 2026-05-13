use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::{AppError, AppResult};
use crate::services::admin_service::{AdminService, AdminUserListItem, Paginated, UserFilters};
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(filters): Query<UserFilters>,
) -> AppResult<Json<Paginated<AdminUserListItem>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_users(filters).await?))
}

pub async fn block(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.block_user(id).await?;
    svc.log_action(admin.0.sub, "user.blocked", Some("user"), Some(id), None).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn unblock(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.unblock_user(id).await?;
    svc.log_action(admin.0.sub, "user.unblocked", Some("user"), Some(id), None).await;
    Ok(Json(json!({ "ok": true })))
}

#[derive(Debug, Deserialize)]
pub struct SetRolesRequest {
    pub roles: Vec<String>,
}

pub async fn set_roles(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<SetRolesRequest>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.set_user_roles(id, payload.roles.clone()).await?;
    svc.log_action(
        admin.0.sub,
        "user.roles_updated",
        Some("user"),
        Some(id),
        Some(json!({ "roles": payload.roles })),
    )
    .await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn delete_user(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    if admin.0.sub == id {
        return Err(AppError::Validation(
            "Нельзя удалить собственный аккаунт".to_string(),
        ));
    }
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    // Log first so the audit row isn't wiped by the delete cascade
    svc.log_action(admin.0.sub, "user.deleted", Some("user"), Some(id), None)
        .await;
    svc.delete_user(id).await?;
    Ok(Json(json!({ "ok": true })))
}
