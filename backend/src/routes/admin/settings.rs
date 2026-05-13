use axum::{
    extract::{Path, State},
    Json,
};

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{AdminService, SiteSetting, UpdateSettingRequest};
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<Vec<SiteSetting>>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.list_settings().await?))
}

pub async fn update(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(key): Path<String>,
    Json(payload): Json<UpdateSettingRequest>,
) -> AppResult<Json<SiteSetting>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    let s = svc.update_setting(&key, payload.value).await?;
    svc.log_action(admin.0.sub, "settings.updated", Some("setting"), None, None).await;
    Ok(Json(s))
}
