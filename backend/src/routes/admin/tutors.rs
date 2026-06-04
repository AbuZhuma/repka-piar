use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::{AppError, AppResult};
use crate::services::admin_service::{
    AdminService, AdminTutorFull, AdminTutorFilters, AdminTutorListItem, ModerationActionRequest,
    Paginated,
};
use crate::services::cache_keys;
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(filters): Query<AdminTutorFilters>,
) -> AppResult<Json<Paginated<AdminTutorListItem>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_tutors(filters).await?))
}

pub async fn pending(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<Paginated<AdminTutorListItem>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let mut filters = AdminTutorFilters {
        status: Some("pending".to_string()),
        q: None,
        page: Some(1),
        limit: Some(100),
    };
    let res = svc.list_tutors(filters).await?;
    // Also include pending_review
    filters = AdminTutorFilters {
        status: Some("pending_review".to_string()),
        q: None,
        page: Some(1),
        limit: Some(100),
    };
    let res2 = svc.list_tutors(filters).await?;
    let mut data = res.data;
    data.extend(res2.data);
    let total = data.len() as i64;
    Ok(Json(Paginated {
        data,
        pagination: crate::services::admin_service::Pagination {
            page: 1,
            limit: 100,
            total,
            total_pages: 1,
        },
    }))
}

pub async fn get(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AdminTutorFull>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.get_tutor_full(id).await?))
}

pub async fn approve(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<ModerationActionRequest>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.approve_tutor(id, admin.0.sub, payload.notes.as_deref()).await?;
    svc.log_action(admin.0.sub, "tutor.approved", Some("tutor"), Some(id), None).await;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn reject(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<ModerationActionRequest>,
) -> AppResult<Json<Value>> {
    let reason = payload
        .reason
        .clone()
        .ok_or_else(|| AppError::Validation("reason is required".into()))?;
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.reject_tutor(id, admin.0.sub, &reason, payload.notes.as_deref()).await?;
    svc.log_action(
        admin.0.sub,
        "tutor.rejected",
        Some("tutor"),
        Some(id),
        Some(json!({ "reason": reason })),
    )
    .await;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn request_changes(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<ModerationActionRequest>,
) -> AppResult<Json<Value>> {
    let reason = payload
        .reason
        .clone()
        .ok_or_else(|| AppError::Validation("reason is required".into()))?;
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.request_changes(id, admin.0.sub, &reason, payload.notes.as_deref()).await?;
    svc.log_action(
        admin.0.sub,
        "tutor.changes_requested",
        Some("tutor"),
        Some(id),
        Some(json!({ "reason": reason })),
    )
    .await;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn block(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<ModerationActionRequest>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.block_tutor(id, admin.0.sub, payload.reason.as_deref()).await?;
    svc.log_action(admin.0.sub, "tutor.blocked", Some("tutor"), Some(id), None).await;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn unblock(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.unblock_tutor(id, admin.0.sub).await?;
    svc.log_action(admin.0.sub, "tutor.unblocked", Some("tutor"), Some(id), None).await;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn delete_tutor(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_tutor(id).await?;
    svc.log_action(admin.0.sub, "tutor.deleted", Some("tutor"), Some(id), None).await;
    cache_keys::purge_tutors(&state.cache).await;
    Ok(Json(json!({ "ok": true })))
}
