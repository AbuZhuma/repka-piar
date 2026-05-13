use std::net::SocketAddr;

use axum::{
    extract::{ConnectInfo, Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{
    AdminFeedback, AdminService, CreateFeedbackRequest, Paginated, UpdateFeedbackRequest,
};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct FeedbackQuery {
    pub status: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(q): Query<FeedbackQuery>,
) -> AppResult<Json<Paginated<AdminFeedback>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(
        svc.list_feedback(q.status.as_deref(), q.page.unwrap_or(1), q.limit.unwrap_or(50))
            .await?,
    ))
}

pub async fn get(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AdminFeedback>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.get_feedback(id).await?))
}

pub async fn update(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateFeedbackRequest>,
) -> AppResult<Json<AdminFeedback>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let f = svc.update_feedback(id, admin.0.sub, payload).await?;
    svc.log_action(admin.0.sub, "feedback.updated", Some("feedback"), Some(id), None).await;
    Ok(Json(f))
}

// Public endpoint (no admin auth) for /contacts form submission
pub async fn create_public(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<CreateFeedbackRequest>,
) -> AppResult<Json<AdminFeedback>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let ip = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| Some(addr.ip().to_string()));
    let ua = headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    Ok(Json(svc.create_feedback(payload, ip, ua).await?))
}
