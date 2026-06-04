use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Subject {
    pub id: Uuid,
    pub slug: String,
    pub name_ru: String,
    pub name_kg: Option<String>,
    pub name_en: Option<String>,
    pub icon: Option<String>,
    pub category: Option<String>,
}
