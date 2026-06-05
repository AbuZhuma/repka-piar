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
    fetch_avatar_url, AccessTokenResponse, AuthResponse, ChangePasswordRequest,
    DeleteAccountRequest, ForgotPasswordRequest, LoginRequest, LogoutRequest, RefreshRequest,
    RegisterRequest, ResetPasswordRequest, SessionInfo, UserService,
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
    let (mut resp, token) = svc
        .register(
            payload,
            extract_user_agent(&headers),
            extract_ip(&headers, &addr),
        )
        .await?;
    // Fire-and-forget verification email. Errors are logged, not fatal.
    if let Some(token) = token {
        let email_svc = state.email.clone();
        let to_email = resp.user.email.clone();
        tokio::spawn(async move {
            if let Err(e) = email_svc.send_verification(&to_email, &token).await {
                tracing::warn!(error = %e, "verification email failed");
            }
        });
    }
    resp.user.avatar_url = fetch_avatar_url(&state.pool, resp.user.id).await;
    Ok(Json(resp))
}

#[derive(Debug, serde::Deserialize)]
pub struct VerifyEmailQuery {
    pub token: String,
}

pub async fn verify_email(
    State(state): State<AppState>,
    Json(payload): Json<VerifyEmailQuery>,
) -> AppResult<Json<serde_json::Value>> {
    crate::services::user_service::consume_email_verification_token(
        &state.pool,
        &payload.token,
    )
    .await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn resend_verification(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<serde_json::Value>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let user = svc.get_user_by_id(auth.0.sub).await?;
    if user.email_verified {
        return Ok(Json(serde_json::json!({ "ok": true, "already_verified": true })));
    }
    let token = crate::services::user_service::create_email_verification_token(
        &state.pool,
        user.id,
        &user.email,
    )
    .await?;
    let email_svc = state.email.clone();
    let to_email = user.email.clone();
    tokio::spawn(async move {
        if let Err(e) = email_svc.send_verification(&to_email, &token).await {
            tracing::warn!(error = %e, "verification email failed");
        }
    });
    Ok(Json(serde_json::json!({ "ok": true })))
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

#[derive(Debug, serde::Deserialize)]
pub struct UpdateMeRequest {
    pub name: Option<String>,
    pub surname: Option<String>,
    pub phone: Option<String>,
    pub locale: Option<String>,
    pub avatar_url: Option<String>,
}

pub async fn update_me(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<UpdateMeRequest>,
) -> AppResult<Json<UserPublic>> {
    // Only update fields that are explicitly provided to allow partial PATCH.
    sqlx::query(
        "UPDATE users SET \
           name       = COALESCE($2, name), \
           surname    = COALESCE($3, surname), \
           phone      = COALESCE(NULLIF($4, ''), phone), \
           locale     = COALESCE($5, locale), \
           avatar_url = CASE WHEN $6 IS NULL THEN avatar_url ELSE $6 END \
         WHERE id = $1",
    )
    .bind(auth.0.sub)
    .bind(payload.name.as_deref())
    .bind(payload.surname.as_deref())
    .bind(payload.phone.as_deref())
    .bind(payload.locale.as_deref())
    .bind(payload.avatar_url.as_deref())
    .execute(&state.pool)
    .await?;

    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let user = svc.get_user_by_id(auth.0.sub).await?;
    let mut out: UserPublic = user.into();
    out.avatar_url = fetch_avatar_url(&state.pool, out.id).await;
    Ok(Json(out))
}

pub async fn me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<UserPublic>> {
    let svc = UserService::new(state.pool.clone(), state.config.clone());
    let user = svc.get_user_by_id(auth.0.sub).await?;
    let mut out: UserPublic = user.into();
    out.avatar_url = fetch_avatar_url(&state.pool, out.id).await;
    Ok(Json(out))
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
