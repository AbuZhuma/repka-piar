use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Subject {
    pub id: Uuid,
    pub slug: String,
    pub name_ru: String,
    pub name_kg: Option<String>,
    pub name_en: Option<String>,
    pub icon: Option<String>,
    pub category: Option<String>,
}
