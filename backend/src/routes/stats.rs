use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::error::AppResult;
use crate::services::cache_keys;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformStats {
    /// Active, verified tutor profiles published to the catalog.
    pub tutors_total: i64,
    /// Subjects available in the dictionary.
    pub subjects_total: i64,
    /// Cities marked as active.
    pub cities_total: i64,
    /// Posts with status='published'.
    pub posts_published: i64,
    /// Average rating across rated tutors (null if no ratings yet).
    pub avg_rating: Option<f64>,
    /// Total reviews left across all tutors.
    pub reviews_total: i64,
}

pub async fn platform_stats(State(state): State<AppState>) -> AppResult<Json<PlatformStats>> {
    if let Some(cached) = state.cache.get::<PlatformStats>(cache_keys::KEY_STATS).await {
        return Ok(Json(cached));
    }

    let (tutors_total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tutor_profiles WHERE status = 'active'",
    )
    .fetch_one(&state.pool)
    .await?;

    let (subjects_total,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM subjects")
            .fetch_one(&state.pool)
            .await?;

    let (cities_total,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM cities WHERE is_active = TRUE")
            .fetch_one(&state.pool)
            .await?;

    let (posts_published,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM posts WHERE status = 'published'",
    )
    .fetch_one(&state.pool)
    .await?;

    let avg_row: (Option<f64>, i64) = sqlx::query_as(
        "SELECT AVG(rating)::float8, COALESCE(SUM(reviews_count), 0)::bigint \
         FROM tutor_profiles \
         WHERE status = 'active' AND rating IS NOT NULL AND reviews_count > 0",
    )
    .fetch_one(&state.pool)
    .await?;

    let stats = PlatformStats {
        tutors_total,
        subjects_total,
        cities_total,
        posts_published,
        avg_rating: avg_row.0.map(|r| (r * 10.0).round() / 10.0),
        reviews_total: avg_row.1,
    };

    state
        .cache
        .set(cache_keys::KEY_STATS, &stats, Some(cache_keys::TTL_DICTIONARIES))
        .await;
    Ok(Json(stats))
}
