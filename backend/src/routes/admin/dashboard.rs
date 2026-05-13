use axum::{extract::State, Json};

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{AdminService, DashboardStats};
use crate::AppState;

pub async fn dashboard(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<DashboardStats>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.dashboard().await?))
}
