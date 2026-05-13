use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use super::city::City;
use super::subject::Subject;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TutorProfile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub slug: String,
    pub school_id: Option<Uuid>,
    pub school_status: Option<String>,

    pub bio: Option<String>,
    pub short_bio: Option<String>,
    pub photo_url: Option<String>,
    pub video_url: Option<String>,

    pub is_native_speaker: bool,
    pub experience_years: i32,
    pub specializations: Vec<String>,

    pub city_id: Option<Uuid>,
    pub address: Option<String>,
    pub student_districts: Option<Vec<String>>,
    pub schedule_text: Option<String>,

    pub price_per_60: Option<i32>,
    pub price_per_90: Option<i32>,
    pub currency: String,
    pub trial_enabled: bool,

    pub contact_phone: Option<String>,
    pub contact_whatsapp: Option<String>,
    pub contact_telegram: Option<String>,
    pub contact_email: Option<String>,
    pub contact_instagram: Option<String>,

    pub status: String,
    pub verified: bool,
    pub rejection_reason: Option<String>,

    pub badges: Vec<String>,

    pub views_count: i32,
    pub contact_clicks_count: i32,
    pub rating: Option<Decimal>,
    pub reviews_count: i32,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct TutorProfilePublic {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub surname: String,

    pub bio: Option<String>,
    pub short_bio: Option<String>,
    pub photo_url: Option<String>,
    pub video_url: Option<String>,

    pub is_native_speaker: bool,
    pub experience_years: i32,
    pub specializations: Vec<String>,

    pub city: Option<City>,
    pub address: Option<String>,
    pub student_districts: Option<Vec<String>>,
    pub schedule_text: Option<String>,

    pub price: TutorPrice,

    pub contacts_masked: ContactsMasked,

    pub status: String,
    pub verified: bool,

    pub badges: Vec<String>,

    pub views_count: i32,
    pub rating: Option<f64>,
    pub reviews_count: i32,
}

#[derive(Debug, Serialize)]
pub struct TutorProfileFull {
    #[serde(flatten)]
    pub profile: TutorProfilePublic,
    pub subjects: Vec<Subject>,
    pub goals: Vec<String>,
    pub age_groups: Vec<String>,
    pub formats: Vec<String>,
    pub languages: Vec<TutorLanguage>,
    pub education: Vec<Education>,
    pub experience: Vec<WorkExperience>,
    pub documents: Vec<TutorDocument>,
}

#[derive(Debug, Serialize)]
pub struct TutorPrice {
    pub per_60: Option<i32>,
    pub per_90: Option<i32>,
    pub currency: String,
    pub trial_enabled: bool,
}

#[derive(Debug, Serialize)]
pub struct ContactsMasked {
    pub phone: Option<String>,
    pub whatsapp: bool,
    pub telegram: bool,
    pub email: Option<String>,
    pub instagram: bool,
}

#[derive(Debug, Serialize)]
pub struct ContactsRevealed {
    pub phone: Option<String>,
    pub whatsapp: Option<String>,
    pub telegram: Option<String>,
    pub email: Option<String>,
    pub instagram: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TutorLanguage {
    pub language_code: String,
    pub level: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Education {
    pub id: Uuid,
    pub institution: String,
    pub specialty: Option<String>,
    pub year_start: Option<i32>,
    pub year_end: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct WorkExperience {
    pub id: Uuid,
    pub position: String,
    pub company: Option<String>,
    pub year_start: Option<i32>,
    pub year_end: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TutorDocument {
    pub id: Uuid,
    pub title: Option<String>,
    pub file_url: String,
    pub file_type: Option<String>,
    pub verified: bool,
}

// Row для каталог-листинга. JOIN на users + LEFT JOIN на cities.
#[derive(Debug, FromRow)]
pub struct TutorListRow {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub surname: String,
    pub bio: Option<String>,
    pub short_bio: Option<String>,
    pub photo_url: Option<String>,
    pub video_url: Option<String>,
    pub is_native_speaker: bool,
    pub experience_years: i32,
    pub specializations: Vec<String>,
    pub address: Option<String>,
    pub student_districts: Option<Vec<String>>,
    pub schedule_text: Option<String>,
    pub price_per_60: Option<i32>,
    pub price_per_90: Option<i32>,
    pub currency: String,
    pub trial_enabled: bool,
    pub contact_phone: Option<String>,
    pub contact_whatsapp: Option<String>,
    pub contact_telegram: Option<String>,
    pub contact_email: Option<String>,
    pub contact_instagram: Option<String>,
    pub status: String,
    pub verified: bool,
    pub badges: Vec<String>,
    pub views_count: i32,
    pub rating: Option<Decimal>,
    pub reviews_count: i32,
    pub city_id: Option<Uuid>,
    pub city_slug: Option<String>,
    pub city_name_ru: Option<String>,
    pub city_name_kg: Option<String>,
    pub city_name_en: Option<String>,
    pub city_timezone: Option<String>,
    pub city_lat: Option<f64>,
    pub city_lng: Option<f64>,
}
