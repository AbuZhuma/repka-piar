use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{
    AdminCity, AdminService, AdminSubject, CityRequest, SubjectRequest,
};
use crate::AppState;

// Cities
pub async fn list_cities(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<Vec<AdminCity>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_cities().await?))
}

pub async fn create_city(
    State(state): State<AppState>,
    admin: AdminUser,
    Json(payload): Json<CityRequest>,
) -> AppResult<Json<AdminCity>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let c = svc.create_city(payload).await?;
    svc.log_action(admin.0.sub, "city.created", Some("city"), Some(c.id), None).await;
    Ok(Json(c))
}

pub async fn update_city(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<CityRequest>,
) -> AppResult<Json<AdminCity>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let c = svc.update_city(id, payload).await?;
    svc.log_action(admin.0.sub, "city.updated", Some("city"), Some(id), None).await;
    Ok(Json(c))
}

pub async fn delete_city(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_city(id).await?;
    svc.log_action(admin.0.sub, "city.deleted", Some("city"), Some(id), None).await;
    Ok(Json(json!({ "ok": true })))
}

// Subjects
pub async fn list_subjects(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<Vec<AdminSubject>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_subjects().await?))
}

pub async fn create_subject(
    State(state): State<AppState>,
    admin: AdminUser,
    Json(payload): Json<SubjectRequest>,
) -> AppResult<Json<AdminSubject>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let s = svc.create_subject(payload).await?;
    svc.log_action(admin.0.sub, "subject.created", Some("subject"), Some(s.id), None).await;
    Ok(Json(s))
}

pub async fn update_subject(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<SubjectRequest>,
) -> AppResult<Json<AdminSubject>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let s = svc.update_subject(id, payload).await?;
    svc.log_action(admin.0.sub, "subject.updated", Some("subject"), Some(id), None).await;
    Ok(Json(s))
}

pub async fn delete_subject(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    svc.delete_subject(id).await?;
    svc.log_action(admin.0.sub, "subject.deleted", Some("subject"), Some(id), None).await;
    Ok(Json(json!({ "ok": true })))
}
