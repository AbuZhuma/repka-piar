use sqlx::postgres::{PgPool, PgPoolOptions};

pub async fn init_pool(url: &str) -> anyhow::Result<PgPool> {
    Ok(PgPoolOptions::new()
        .max_connections(10)
        .connect(url)
        .await?)
}
