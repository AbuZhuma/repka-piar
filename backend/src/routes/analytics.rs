use std::net::SocketAddr;

use axum::{
    extract::{ConnectInfo, Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::auth::middleware::AuthUser;
use crate::error::AppResult;
use crate::services::analytics_service::{
    AnalyticsService, ContactChannel, ContactClicksResponse, DashboardResponse, DayCount,
    OverviewResponse, Period, PeriodQuery, RevealContactsResponse, SourcesResponse,
};
use crate::utils::ip::get_client_ip;
use crate::AppState;

fn ua(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

fn referrer(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::REFERER)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

#[derive(Debug, Deserialize)]
pub struct RevealContactsRequest {
    #[allow(dead_code)]
    pub captcha_token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ContactClickRequest {
    pub channel: ContactChannel,
}

pub async fn reveal_contacts(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Path(slug): Path<String>,
    Json(_payload): Json<RevealContactsRequest>,
) -> AppResult<Json<RevealContactsResponse>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let ip = get_client_ip(&headers, &addr);
    let resp = svc
        .reveal_contacts(&slug, None, Some(&ip), ua(&headers), referrer(&headers))
        .await?;
    Ok(Json(resp))
}

pub async fn contact_click(
    State(state): State<AppState>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Path(slug): Path<String>,
    Json(payload): Json<ContactClickRequest>,
) -> AppResult<Json<Value>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let ip = get_client_ip(&headers, &addr);
    svc.record_contact_click(
        &slug,
        payload.channel,
        None,
        Some(&ip),
        referrer(&headers),
    )
    .await?;
    Ok(Json(json!({ "success": true })))
}

pub async fn overview(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<PeriodQuery>,
) -> AppResult<Json<OverviewResponse>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let period = Period::from_query(q.period.as_deref());
    Ok(Json(svc.overview(auth.0.sub, period).await?))
}

pub async fn views(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<PeriodQuery>,
) -> AppResult<Json<Value>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let period = Period::from_query(q.period.as_deref());
    let data: Vec<DayCount> = svc.views_by_day(auth.0.sub, period).await?;
    Ok(Json(json!({ "data": data })))
}

pub async fn contact_clicks(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<PeriodQuery>,
) -> AppResult<Json<ContactClicksResponse>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let period = Period::from_query(q.period.as_deref());
    Ok(Json(svc.contact_clicks(auth.0.sub, period).await?))
}

pub async fn sources(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<PeriodQuery>,
) -> AppResult<Json<SourcesResponse>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let period = Period::from_query(q.period.as_deref());
    Ok(Json(svc.sources(auth.0.sub, period).await?))
}

pub async fn recent_events(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<Value>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    let events = svc.recent_events(auth.0.sub).await?;
    Ok(Json(json!({ "events": events })))
}

pub async fn dashboard(
    State(state): State<AppState>,
    auth: AuthUser,
) -> AppResult<Json<DashboardResponse>> {
    let svc = AnalyticsService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.dashboard(auth.0.sub).await?))
}
