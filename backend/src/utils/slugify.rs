use slug::slugify;
use sqlx::PgPool;

use crate::error::AppResult;

pub fn generate_slug(name: &str, surname: &str, suffix: Option<&str>) -> String {
    let base = format!("{} {}", name, surname);
    let mut s = slugify(&base);
    if let Some(extra) = suffix {
        let extra_slug = slugify(extra);
        if !extra_slug.is_empty() {
            s = format!("{}-{}", s, extra_slug);
        }
    }
    if s.is_empty() {
        "tutor".to_string()
    } else {
        s
    }
}

pub async fn unique_tutor_slug(pool: &PgPool, base_slug: &str) -> AppResult<String> {
    let mut slug = base_slug.to_string();
    let mut counter = 2u32;
    loop {
        let exists: Option<(bool,)> = sqlx::query_as(
            "SELECT EXISTS(SELECT 1 FROM tutor_profiles WHERE slug = $1)",
        )
        .bind(&slug)
        .fetch_optional(pool)
        .await?;
        if !exists.map(|t| t.0).unwrap_or(false) {
            return Ok(slug);
        }
        slug = format!("{}-{}", base_slug, counter);
        counter += 1;
        if counter > 1000 {
            return Ok(format!("{}-{}", base_slug, uuid::Uuid::new_v4().simple()));
        }
    }
}
