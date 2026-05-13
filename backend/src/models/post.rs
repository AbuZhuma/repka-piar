use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct Post {
    pub id: Uuid,
    pub slug: String,

    pub title_ru: String,
    pub title_kg: Option<String>,
    pub title_en: Option<String>,

    pub excerpt_ru: Option<String>,
    pub excerpt_kg: Option<String>,
    pub excerpt_en: Option<String>,

    pub content_ru: serde_json::Value,
    pub content_kg: Option<serde_json::Value>,
    pub content_en: Option<serde_json::Value>,

    pub cover_url: Option<String>,

    pub category_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub tags: Vec<String>,
    pub reading_time: Option<i32>,

    pub status: String,
    pub published_at: Option<DateTime<Utc>>,

    pub views_count: i32,
    pub likes_count: i32,
    pub is_featured: bool,
    pub is_pinned: bool,

    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_og_image: Option<String>,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct PostCategory {
    pub id: Uuid,
    pub slug: String,
    #[sqlx(rename = "name_ru")]
    #[serde(skip)]
    pub name_ru: String,
    #[sqlx(rename = "name_kg")]
    #[serde(skip)]
    pub name_kg: Option<String>,
    #[sqlx(rename = "name_en")]
    #[serde(skip)]
    pub name_en: Option<String>,
    pub description: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PostCategoryView {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
}

impl PostCategory {
    pub fn localized_name(&self, locale: &str) -> String {
        match locale {
            "kg" => self.name_kg.clone().unwrap_or_else(|| self.name_ru.clone()),
            "en" => self.name_en.clone().unwrap_or_else(|| self.name_ru.clone()),
            _ => self.name_ru.clone(),
        }
    }

    pub fn into_view(self, locale: &str) -> PostCategoryView {
        let name = self.localized_name(locale);
        PostCategoryView {
            id: self.id,
            slug: self.slug,
            name,
            description: self.description,
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct PostAuthor {
    pub id: Uuid,
    pub name: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub role: Option<String>,
    pub socials: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct PostSeo {
    pub title: Option<String>,
    pub description: Option<String>,
    pub og_image: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PostListItem {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub cover_url: Option<String>,
    pub category: Option<PostCategoryView>,
    pub author: Option<PostAuthor>,
    pub tags: Vec<String>,
    pub reading_time: Option<i32>,
    pub published_at: Option<DateTime<Utc>>,
    pub views_count: i32,
    pub is_featured: bool,
}

#[derive(Debug, Serialize)]
pub struct PostFull {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub content: serde_json::Value,
    pub cover_url: Option<String>,
    pub category: Option<PostCategoryView>,
    pub author: Option<PostAuthor>,
    pub tags: Vec<String>,
    pub reading_time: Option<i32>,
    pub published_at: Option<DateTime<Utc>>,
    pub views_count: i32,
    pub seo: PostSeo,
    pub related: Vec<PostListItem>,
    pub is_translation_missing: bool,
}

#[derive(Debug, Deserialize)]
pub struct PostFilters {
    pub category: Option<String>,
    pub tag: Option<String>,
    pub q: Option<String>,
    pub featured: Option<bool>,
    pub locale: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}
