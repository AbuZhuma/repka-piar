use axum::{extract::State, Json};

use crate::auth::admin_middleware::AdminUser;
use crate::error::AppResult;
use crate::services::admin_service::{AdminService, FullAnalytics};
use crate::AppState;

pub async fn full(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> AppResult<Json<FullAnalytics>> {
    let svc = AdminService::new(state.pool.clone(), state.config.clone());
    Ok(Json(svc.full_analytics().await?))
}
