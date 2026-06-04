use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct City {
    pub id: Uuid,
    pub slug: String,
    pub name_ru: String,
    pub name_kg: Option<String>,
    pub name_en: Option<String>,
    pub timezone: String,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
}
