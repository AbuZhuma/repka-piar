use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub phone: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub name: String,
    pub surname: String,
    pub roles: Vec<String>,
    pub locale: String,
    pub timezone: String,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub is_blocked: bool,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: Uuid,
    pub email: String,
    pub phone: String,
    pub name: String,
    pub surname: String,
    pub roles: Vec<String>,
    pub locale: String,
    pub timezone: String,
    pub email_verified: bool,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            phone: u.phone,
            name: u.name,
            surname: u.surname,
            roles: u.roles,
            locale: u.locale,
            timezone: u.timezone,
            email_verified: u.email_verified,
            avatar_url: None,
            created_at: u.created_at,
        }
    }
}
