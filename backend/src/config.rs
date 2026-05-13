use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub cors_origin: String,
    pub ip_hash_salt: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .context("DATABASE_URL is required")?,
            jwt_secret: std::env::var("JWT_SECRET").context("JWT_SECRET is required")?,
            cors_origin: std::env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            ip_hash_salt: std::env::var("IP_HASH_SALT")
                .unwrap_or_else(|_| "repka_dev_ip_salt".to_string()),
        })
    }
}
