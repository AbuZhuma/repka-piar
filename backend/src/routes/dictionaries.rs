use axum::{extract::State, Json};
use serde_json::{json, Value};

use crate::error::AppResult;
use crate::models::city::City;
use crate::models::subject::Subject;
use crate::services::cache_keys;
use crate::AppState;

pub async fn cities(State(state): State<AppState>) -> AppResult<Json<Vec<City>>> {
    let key = cache_keys::dict_cities();
    if let Some(cached) = state.cache.get::<Vec<City>>(&key).await {
        return Ok(Json(cached));
    }
    let rows = sqlx::query_as::<_, City>(
        "SELECT id, slug, name_ru, name_kg, name_en, timezone, lat, lng \
         FROM cities WHERE is_active = TRUE ORDER BY name_ru",
    )
    .fetch_all(&state.pool)
    .await?;
    state
        .cache
        .set(&key, &rows, Some(cache_keys::TTL_DICTIONARIES))
        .await;
    Ok(Json(rows))
}

pub async fn subjects(State(state): State<AppState>) -> AppResult<Json<Vec<Subject>>> {
    let key = cache_keys::dict_subjects();
    if let Some(cached) = state.cache.get::<Vec<Subject>>(&key).await {
        return Ok(Json(cached));
    }
    let rows = sqlx::query_as::<_, Subject>(
        "SELECT id, slug, name_ru, name_kg, name_en, icon, category \
         FROM subjects ORDER BY sort_order",
    )
    .fetch_all(&state.pool)
    .await?;
    state
        .cache
        .set(&key, &rows, Some(cache_keys::TTL_DICTIONARIES))
        .await;
    Ok(Json(rows))
}

pub async fn all(State(state): State<AppState>) -> AppResult<Json<Value>> {
    let key = cache_keys::dict_all();
    if let Some(cached) = state.cache.get::<Value>(&key).await {
        return Ok(Json(cached));
    }
    let cities = sqlx::query_as::<_, City>(
        "SELECT id, slug, name_ru, name_kg, name_en, timezone, lat, lng \
         FROM cities WHERE is_active = TRUE ORDER BY name_ru",
    )
    .fetch_all(&state.pool)
    .await?;
    let subjects = sqlx::query_as::<_, Subject>(
        "SELECT id, slug, name_ru, name_kg, name_en, icon, category \
         FROM subjects ORDER BY sort_order",
    )
    .fetch_all(&state.pool)
    .await?;
    let body = json!({ "cities": cities, "subjects": subjects });
    state
        .cache
        .set(&key, &body, Some(cache_keys::TTL_DICTIONARIES))
        .await;
    Ok(Json(body))
}
