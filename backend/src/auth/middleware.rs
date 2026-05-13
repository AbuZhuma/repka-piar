use std::sync::Arc;

use axum::{
    async_trait,
    extract::FromRef,
    extract::FromRequestParts,
    http::{header, request::Parts},
};

use crate::auth::jwt::{verify_token, Claims};
use crate::config::Config;
use crate::error::AppError;

pub struct AuthUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    Arc<Config>: FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;

        let config = Arc::<Config>::from_ref(state);
        let claims = verify_token(token, &config.jwt_secret).map_err(|_| AppError::Unauthorized)?;
        Ok(AuthUser(claims))
    }
}
