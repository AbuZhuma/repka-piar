use axum::{
    extract::{ConnectInfo, Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde::Deserialize;
use std::net::SocketAddr;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppResult;
use crate::models::user::UserPublic;
use crate::services::user_service::{
    AccessTokenResponse, AuthResponse, ChangePasswordRequest, DeleteAccountRequest,
    ForgotPasswordRequest, LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest,
    ResetPasswordRequest, SessionInfo, UserService,
};
use crate::AppState;

fn extract_user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

fn extract_ip(headers: &HeaderMap, addr: &SocketAddr) -> Option<String> {
    if let Some(v) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok()) {
        if let Some(first) = v.split(',').next() {
            return Some(first.trim().to_string());
        }
    }
    if let Some(v) = headers.get("x-real-ip").and_then(|v| v.to_str().ok()) {
        return Some(v.to_string());
    }
    Some(addr.ip().to_string())
}

pub async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<RegisterRequest>,
) -> AppResult<Json<AuthResponse>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let resp = svc
        .register(
            payload,
            extract_user_agent(&headers),
            extract_ip(&headers, &addr),
        )
        .await?;
    Ok(Json(resp))
}

pub async fn login(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let resp = svc
        .login(
            payload,
            extract_user_agent(&headers),
            extract_ip(&headers, &addr),
        )
        .await?;
    Ok(Json(resp))
}

pub async fn refresh(
    State(state): State<AppState>,
    Json(payload): Json<RefreshRequest>,
) -> AppResult<Json<AccessTokenResponse>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let resp = svc.refresh(&payload.refresh_token).await?;
    Ok(Json(resp))
}

pub async fn logout(
    State(state): State<AppState>,
    Json(payload): Json<LogoutRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    svc.logout(&payload.refresh_token).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<UserPublic>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let user = svc.get_user_by_id(auth.0.sub).await?;
    Ok(Json(user.into()))
}

pub async fn change_password(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<ChangePasswordRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    svc.change_password(auth.0.sub, &payload.old_password, &payload.new_password)
        .await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    svc.request_password_reset(&payload.email_or_phone).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    svc.reset_password(&payload.token, &payload.new_password)
        .await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

#[derive(Debug, Deserialize)]
pub struct ListSessionsQuery {
    pub current_refresh_token: Option<String>,
}

pub async fn list_sessions(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<ListSessionsQuery>,
) -> AppResult<Json<Vec<SessionInfo>>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let sessions = svc
        .list_sessions(auth.0.sub, q.current_refresh_token.as_deref())
        .await?;
    Ok(Json(sessions))
}

pub async fn revoke_session(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    svc.revoke_session(auth.0.sub, id).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn delete_account(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<DeleteAccountRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    svc.delete_account(auth.0.sub, &payload.password).await?;
    if let Some(reason) = payload.reason {
        tracing::info!(user_id = %auth.0.sub, %reason, "account deletion completed");
    } else {
        tracing::info!(user_id = %auth.0.sub, "account deletion completed");
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}
