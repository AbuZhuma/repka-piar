use std::sync::Arc;

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use regex::Regex;
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::{create_access_token, create_refresh_token};
use crate::auth::password::{hash_password, verify_password};
use crate::config::Config;
use crate::error::{AppError, AppResult};
use crate::models::user::{User, UserPublic};

pub static PHONE_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^\+(?:996|7|998|992)\d{9,10}$").unwrap());

#[derive(Debug, serde::Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1, max = 32))]
    pub phone: String,
    #[validate(length(min = 1, max = 128))]
    pub name: String,
    #[validate(length(min = 1, max = 128))]
    pub surname: String,
    #[validate(length(min = 8, max = 128))]
    pub password: String,
    pub locale: Option<String>,
}

#[derive(Debug, serde::Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1))]
    pub email_or_phone: String,
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct LogoutRequest {
    pub refresh_token: String,
}

#[derive(Debug, serde::Deserialize, Validate)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 1))]
    pub old_password: String,
    #[validate(length(min = 8, max = 128))]
    pub new_password: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct ForgotPasswordRequest {
    pub email_or_phone: String,
}

#[derive(Debug, serde::Deserialize, Validate)]
pub struct ResetPasswordRequest {
    #[validate(length(min = 1))]
    pub token: String,
    #[validate(length(min = 8, max = 128))]
    pub new_password: String,
}

#[derive(Debug, serde::Serialize)]
pub struct AuthResponse {
    pub user: UserPublic,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, serde::Serialize)]
pub struct AccessTokenResponse {
    pub access_token: String,
}

#[derive(Debug, serde::Serialize)]
pub struct SessionInfo {
    pub id: Uuid,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub is_current: bool,
}

#[derive(Debug, serde::Deserialize)]
pub struct DeleteAccountRequest {
    pub password: String,
    pub reason: Option<String>,
}

pub struct UserService {
    pool: PgPool,
    config: Arc<Config>,
}

impl UserService {
    pub fn new(pool: PgPool, config: Arc<Config>) -> Self {
        Self { pool, config }
    }

    pub async fn register(
        &self,
        payload: RegisterRequest,
        user_agent: Option<String>,
        ip_address: Option<String>,
    ) -> AppResult<AuthResponse> {
        payload.validate()?;
        if !PHONE_REGEX.is_match(&payload.phone) {
            return Err(AppError::Validation(
                "phone must be in international format, e.g. +996700000000".into(),
            ));
        }

        let existing: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM users \
             WHERE (email = $1 OR phone = $2) AND deleted_at IS NULL \
             LIMIT 1",
        )
        .bind(&payload.email)
        .bind(&payload.phone)
        .fetch_optional(&self.pool)
        .await?;

        if existing.is_some() {
            return Err(AppError::Conflict(
                "email or phone already registered".into(),
            ));
        }

        let password_hash = hash_password(&payload.password)
            .map_err(|e| AppError::Internal(format!("password hash failed: {e}")))?;
        let locale = payload.locale.unwrap_or_else(|| "ru".to_string());

        let user: User = sqlx::query_as::<_, User>(
            "INSERT INTO users (email, phone, password_hash, name, surname, roles, locale) \
             VALUES ($1, $2, $3, $4, $5, ARRAY['tutor']::TEXT[], $6) \
             RETURNING *",
        )
        .bind(&payload.email)
        .bind(&payload.phone)
        .bind(&password_hash)
        .bind(&payload.name)
        .bind(&payload.surname)
        .bind(&locale)
        .fetch_one(&self.pool)
        .await?;

        self.issue_tokens(user, user_agent, ip_address).await
    }

    pub async fn login(
        &self,
        payload: LoginRequest,
        user_agent: Option<String>,
        ip_address: Option<String>,
    ) -> AppResult<AuthResponse> {
        payload.validate()?;

        let user = self
            .find_active_user_by_email_or_phone(&payload.email_or_phone)
            .await?
            .ok_or(AppError::Unauthorized)?;

        if user.is_blocked {
            return Err(AppError::Forbidden);
        }

        let ok = verify_password(&payload.password, &user.password_hash)
            .map_err(|_| AppError::Unauthorized)?;
        if !ok {
            return Err(AppError::Unauthorized);
        }

        self.issue_tokens(user, user_agent, ip_address).await
    }

    pub async fn refresh(&self, refresh_token: &str) -> AppResult<AccessTokenResponse> {
        let row: Option<(Uuid, DateTime<Utc>, Option<DateTime<Utc>>)> = sqlx::query_as(
            "SELECT user_id, expires_at, revoked_at FROM auth_sessions WHERE refresh_token = $1",
        )
        .bind(refresh_token)
        .fetch_optional(&self.pool)
        .await?;

        let (user_id, expires_at, revoked_at) = row.ok_or(AppError::Unauthorized)?;
        if revoked_at.is_some() || expires_at < Utc::now() {
            return Err(AppError::Unauthorized);
        }

        let user = self.get_user_by_id(user_id).await?;
        if user.is_blocked {
            return Err(AppError::Forbidden);
        }
        let access = create_access_token(user.id, &user.roles, &self.config.jwt_secret)
            .map_err(|e| AppError::Internal(format!("jwt encode failed: {e}")))?;
        Ok(AccessTokenResponse {
            access_token: access,
        })
    }

    pub async fn logout(&self, refresh_token: &str) -> AppResult<()> {
        sqlx::query(
            "UPDATE auth_sessions SET revoked_at = NOW() \
             WHERE refresh_token = $1 AND revoked_at IS NULL",
        )
        .bind(refresh_token)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_user_by_id(&self, id: Uuid) -> AppResult<User> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?
            .ok_or(AppError::NotFound)
    }

    pub async fn change_password(
        &self,
        user_id: Uuid,
        old: &str,
        new: &str,
    ) -> AppResult<()> {
        if new.len() < 8 || new.len() > 128 {
            return Err(AppError::Validation(
                "new password must be 8..=128 chars".into(),
            ));
        }
        let user = self.get_user_by_id(user_id).await?;
        let ok = verify_password(old, &user.password_hash).map_err(|_| AppError::Unauthorized)?;
        if !ok {
            return Err(AppError::Unauthorized);
        }
        let hash = hash_password(new)
            .map_err(|e| AppError::Internal(format!("password hash failed: {e}")))?;

        let mut tx = self.pool.begin().await?;
        sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
            .bind(&hash)
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "UPDATE auth_sessions SET revoked_at = NOW() \
             WHERE user_id = $1 AND revoked_at IS NULL",
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn request_password_reset(&self, email_or_phone: &str) -> AppResult<()> {
        let Some(user) = self
            .find_active_user_by_email_or_phone(email_or_phone)
            .await?
        else {
            return Ok(());
        };

        let token = create_refresh_token();
        sqlx::query(
            "INSERT INTO password_reset_tokens (token, user_id, expires_at) \
             VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
        )
        .bind(&token)
        .bind(user.id)
        .execute(&self.pool)
        .await?;

        tracing::info!(user_id = %user.id, email = %user.email, %token,
            "password reset token issued (email delivery is TODO)");
        Ok(())
    }

    pub async fn reset_password(&self, token: &str, new_password: &str) -> AppResult<()> {
        if new_password.len() < 8 || new_password.len() > 128 {
            return Err(AppError::Validation(
                "new password must be 8..=128 chars".into(),
            ));
        }
        let row: Option<(Uuid, DateTime<Utc>, Option<DateTime<Utc>>)> = sqlx::query_as(
            "SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1",
        )
        .bind(token)
        .fetch_optional(&self.pool)
        .await?;
        let (user_id, expires_at, used_at) =
            row.ok_or_else(|| AppError::Validation("invalid token".into()))?;
        if used_at.is_some() || expires_at < Utc::now() {
            return Err(AppError::Validation("token expired or already used".into()));
        }

        let hash = hash_password(new_password)
            .map_err(|e| AppError::Internal(format!("password hash failed: {e}")))?;

        let mut tx = self.pool.begin().await?;
        sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
            .bind(&hash)
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1")
            .bind(token)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "UPDATE auth_sessions SET revoked_at = NOW() \
             WHERE user_id = $1 AND revoked_at IS NULL",
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(())
    }

    async fn find_active_user_by_email_or_phone(
        &self,
        email_or_phone: &str,
    ) -> AppResult<Option<User>> {
        Ok(sqlx::query_as::<_, User>(
            "SELECT * FROM users \
             WHERE (email = $1 OR phone = $1) AND deleted_at IS NULL \
             LIMIT 1",
        )
        .bind(email_or_phone)
        .fetch_optional(&self.pool)
        .await?)
    }

    pub async fn list_sessions(
        &self,
        user_id: Uuid,
        current_refresh_token: Option<&str>,
    ) -> AppResult<Vec<SessionInfo>> {
        let rows: Vec<(
            Uuid,
            String,
            Option<String>,
            Option<String>,
            DateTime<Utc>,
            DateTime<Utc>,
        )> = sqlx::query_as(
            "SELECT id, refresh_token, user_agent, ip_address, expires_at, created_at \
             FROM auth_sessions \
             WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() \
             ORDER BY created_at DESC",
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .into_iter()
            .map(|(id, token, ua, ip, exp, created)| SessionInfo {
                id,
                user_agent: ua,
                ip_address: ip,
                expires_at: exp,
                created_at: created,
                is_current: current_refresh_token
                    .map(|t| t == token)
                    .unwrap_or(false),
            })
            .collect())
    }

    pub async fn revoke_session(&self, user_id: Uuid, session_id: Uuid) -> AppResult<()> {
        let res = sqlx::query(
            "UPDATE auth_sessions SET revoked_at = NOW() \
             WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
        )
        .bind(session_id)
        .bind(user_id)
        .execute(&self.pool)
        .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    pub async fn delete_account(&self, user_id: Uuid, password: &str) -> AppResult<()> {
        let user = self.get_user_by_id(user_id).await?;
        let ok = verify_password(password, &user.password_hash)
            .map_err(|_| AppError::Unauthorized)?;
        if !ok {
            return Err(AppError::Unauthorized);
        }

        let mut tx = self.pool.begin().await?;
        sqlx::query("UPDATE users SET deleted_at = NOW() WHERE id = $1")
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "UPDATE auth_sessions SET revoked_at = NOW() \
             WHERE user_id = $1 AND revoked_at IS NULL",
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        sqlx::query("UPDATE tutor_profiles SET status = 'inactive' WHERE user_id = $1")
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(())
    }

    async fn issue_tokens(
        &self,
        user: User,
        user_agent: Option<String>,
        ip_address: Option<String>,
    ) -> AppResult<AuthResponse> {
        let access = create_access_token(user.id, &user.roles, &self.config.jwt_secret)
            .map_err(|e| AppError::Internal(format!("jwt encode failed: {e}")))?;
        let refresh = create_refresh_token();

        sqlx::query(
            "INSERT INTO auth_sessions (user_id, refresh_token, user_agent, ip_address, expires_at) \
             VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')",
        )
        .bind(user.id)
        .bind(&refresh)
        .bind(user_agent)
        .bind(ip_address)
        .execute(&self.pool)
        .await?;

        let mut public: UserPublic = user.into();
        public.avatar_url = fetch_avatar_url(&self.pool, public.id).await;

        Ok(AuthResponse {
            user: public,
            access_token: access,
            refresh_token: refresh,
        })
    }
}

pub async fn fetch_avatar_url(pool: &sqlx::PgPool, user_id: Uuid) -> Option<String> {
    sqlx::query_scalar::<_, Option<String>>(
        "SELECT photo_url FROM tutor_profiles WHERE user_id = $1 AND photo_url IS NOT NULL LIMIT 1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
    .flatten()
}
