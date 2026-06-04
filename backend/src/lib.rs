use std::sync::Arc;

use axum::extract::FromRef;
use sqlx::PgPool;

pub mod auth;
pub mod config;
pub mod db;
pub mod error;
pub mod models;
pub mod routes;
pub mod services;
pub mod utils;

use config::Config;
use services::cache_service::Cache;

#[derive(Clone, FromRef)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Arc<Config>,
    pub upload_dir: Arc<std::path::PathBuf>,
    pub cache: Cache,
}
