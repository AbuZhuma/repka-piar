use std::sync::Arc;

use sqlx::{PgPool, Postgres, QueryBuilder, Row};
use uuid::Uuid;

use crate::config::Config;
use crate::error::{AppError, AppResult};
use crate::models::post::{
    PostAuthor, PostCategory, PostCategoryView, PostFilters, PostFull, PostListItem, PostSeo,
};

const MAX_LIMIT: i64 = 50;
const DEFAULT_LIMIT: i64 = 12;

#[derive(Debug, serde::Serialize)]
pub struct Pagination {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug, serde::Serialize)]
pub struct PostListResponse {
    pub data: Vec<PostListItem>,
    pub pagination: Pagination,
}

pub struct PostService {
    pub pool: PgPool,
    #[allow(dead_code)]
    pub config: Arc<Config>,
}

fn pick_locale(locale: Option<&str>) -> &'static str {
    match locale {
        Some("kg") => "kg",
        Some("en") => "en",
        _ => "ru",
    }
}

fn title_cols(locale: &str) -> &'static str {
    match locale {
        "kg" => "COALESCE(p.title_kg, p.title_ru)",
        "en" => "COALESCE(p.title_en, p.title_ru)",
        _ => "p.title_ru",
    }
}

fn excerpt_cols(locale: &str) -> &'static str {
    match locale {
        "kg" => "COALESCE(p.excerpt_kg, p.excerpt_ru)",
        "en" => "COALESCE(p.excerpt_en, p.excerpt_ru)",
        _ => "p.excerpt_ru",
    }
}

fn content_col(locale: &str) -> &'static str {
    match locale {
        "kg" => "COALESCE(p.content_kg, p.content_ru)",
        "en" => "COALESCE(p.content_en, p.content_ru)",
        _ => "p.content_ru",
    }
}

impl PostService {
    pub fn new(pool: PgPool, config: Arc<Config>) -> Self {
        Self { pool, config }
    }

    pub async fn list_categories(&self, locale: Option<&str>) -> AppResult<Vec<PostCategoryView>> {
        let loc = pick_locale(locale);
        let cats: Vec<PostCategory> = sqlx::query_as::<_, PostCategory>(
            "SELECT id, slug, name_ru, name_kg, name_en, description, sort_order, is_active \
             FROM post_categories WHERE is_active = TRUE ORDER BY sort_order ASC, name_ru ASC",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(cats.into_iter().map(|c| c.into_view(loc)).collect())
    }

    pub async fn search(&self, filters: PostFilters) -> AppResult<PostListResponse> {
        let loc = pick_locale(filters.locale.as_deref()).to_string();
        let limit = filters.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
        let page = filters.page.unwrap_or(1).max(1);
        let offset = (page - 1) * limit;

        let title_expr = title_cols(&loc);
        let excerpt_expr = excerpt_cols(&loc);

        let select = format!(
            "SELECT \
                p.id, p.slug, \
                {title_expr} AS title, \
                {excerpt_expr} AS excerpt, \
                p.cover_url, \
                p.tags, p.reading_time, p.published_at, p.views_count, p.is_featured, \
                pc.id AS category_id, pc.slug AS category_slug, \
                pc.name_ru AS category_name_ru, pc.name_kg AS category_name_kg, pc.name_en AS category_name_en, \
                pa.id AS author_id, pa.name AS author_name, pa.bio AS author_bio, \
                pa.avatar_url AS author_avatar, pa.role AS author_role, pa.socials AS author_socials \
             FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id \
             WHERE p.status = 'published'"
        );

        let mut data_q = QueryBuilder::<Postgres>::new(select);
        Self::push_filters(&mut data_q, &filters);
        data_q.push(" ORDER BY p.is_pinned DESC, p.is_featured DESC, p.published_at DESC NULLS LAST");
        data_q.push(" LIMIT ").push_bind(limit);
        data_q.push(" OFFSET ").push_bind(offset);

        let rows = data_q.build().fetch_all(&self.pool).await?;
        let data: Vec<PostListItem> = rows.iter().map(|r| row_to_list_item(r, &loc)).collect();

        let mut count_q = QueryBuilder::<Postgres>::new(
            "SELECT COUNT(*) FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             WHERE p.status = 'published'",
        );
        Self::push_filters(&mut count_q, &filters);
        let total: (i64,) = count_q
            .build_query_as::<(i64,)>()
            .fetch_one(&self.pool)
            .await?;
        let total = total.0;
        let total_pages = if limit == 0 { 0 } else { (total + limit - 1) / limit };

        Ok(PostListResponse {
            data,
            pagination: Pagination { page, limit, total, total_pages },
        })
    }

    fn push_filters(q: &mut QueryBuilder<'_, Postgres>, f: &PostFilters) {
        if let Some(cat) = f.category.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            q.push(" AND pc.slug = ").push_bind(cat.to_string());
        }
        if let Some(tag) = f.tag.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            q.push(" AND ").push_bind(tag.to_string()).push(" = ANY(p.tags)");
        }
        if let Some(query) = f.q.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            let pattern = format!("%{}%", query.replace('%', "\\%"));
            q.push(" AND (p.title_ru ILIKE ");
            q.push_bind(pattern.clone());
            q.push(" OR p.excerpt_ru ILIKE ");
            q.push_bind(pattern);
            q.push(")");
        }
        if let Some(true) = f.featured {
            q.push(" AND p.is_featured = TRUE");
        }
    }

    pub async fn featured(&self, locale: Option<&str>) -> AppResult<Option<PostListItem>> {
        let loc = pick_locale(locale).to_string();
        let title_expr = title_cols(&loc);
        let excerpt_expr = excerpt_cols(&loc);
        let sql = format!(
            "SELECT \
                p.id, p.slug, \
                {title_expr} AS title, \
                {excerpt_expr} AS excerpt, \
                p.cover_url, \
                p.tags, p.reading_time, p.published_at, p.views_count, p.is_featured, \
                pc.id AS category_id, pc.slug AS category_slug, \
                pc.name_ru AS category_name_ru, pc.name_kg AS category_name_kg, pc.name_en AS category_name_en, \
                pa.id AS author_id, pa.name AS author_name, pa.bio AS author_bio, \
                pa.avatar_url AS author_avatar, pa.role AS author_role, pa.socials AS author_socials \
             FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id \
             WHERE p.status = 'published' AND p.is_featured = TRUE \
             ORDER BY p.published_at DESC NULLS LAST LIMIT 1"
        );
        let row = sqlx::query(&sql).fetch_optional(&self.pool).await?;
        Ok(row.map(|r| row_to_list_item(&r, &loc)))
    }

    pub async fn get_by_slug(&self, slug: &str, locale: Option<&str>) -> AppResult<PostFull> {
        let loc = pick_locale(locale).to_string();
        let title_expr = title_cols(&loc);
        let excerpt_expr = excerpt_cols(&loc);
        let content_expr = content_col(&loc);

        let sql = format!(
            "SELECT \
                p.id, p.slug, \
                p.title_ru, p.title_kg, p.title_en, \
                {title_expr} AS title, \
                {excerpt_expr} AS excerpt, \
                {content_expr} AS content, \
                p.content_kg, p.content_en, \
                p.cover_url, p.tags, p.reading_time, p.published_at, p.views_count, \
                p.seo_title, p.seo_description, p.seo_og_image, \
                pc.id AS category_id, pc.slug AS category_slug, \
                pc.name_ru AS category_name_ru, pc.name_kg AS category_name_kg, pc.name_en AS category_name_en, \
                pa.id AS author_id, pa.name AS author_name, pa.bio AS author_bio, \
                pa.avatar_url AS author_avatar, pa.role AS author_role, pa.socials AS author_socials \
             FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id \
             WHERE p.slug = $1 AND p.status = 'published' LIMIT 1"
        );
        let row = sqlx::query(&sql)
            .bind(slug)
            .fetch_optional(&self.pool)
            .await?
            .ok_or(AppError::NotFound)?;

        let id: Uuid = row.try_get("id")?;
        let title: String = row.try_get("title")?;
        let excerpt: Option<String> = row.try_get("excerpt")?;
        let content: serde_json::Value = row.try_get("content")?;
        let cover_url: Option<String> = row.try_get("cover_url")?;
        let tags: Vec<String> = row.try_get("tags")?;
        let reading_time: Option<i32> = row.try_get("reading_time")?;
        let published_at = row.try_get("published_at")?;
        let views_count: i32 = row.try_get("views_count")?;
        let seo_title: Option<String> = row.try_get("seo_title")?;
        let seo_description: Option<String> = row.try_get("seo_description")?;
        let seo_og_image: Option<String> = row.try_get("seo_og_image")?;

        let is_translation_missing = match loc.as_str() {
            "kg" => row.try_get::<Option<serde_json::Value>, _>("content_kg")?.is_none(),
            "en" => row.try_get::<Option<serde_json::Value>, _>("content_en")?.is_none(),
            _ => false,
        };

        let category = build_category(&row, &loc);
        let author = build_author(&row);
        let related = self.related_for(id, 3, &loc).await?;

        Ok(PostFull {
            id,
            slug: row.try_get::<String, _>("slug")?,
            title,
            excerpt,
            content,
            cover_url,
            category,
            author,
            tags,
            reading_time,
            published_at,
            views_count,
            seo: PostSeo {
                title: seo_title,
                description: seo_description,
                og_image: seo_og_image,
            },
            related,
            is_translation_missing,
        })
    }

    pub async fn related_for(
        &self,
        post_id: Uuid,
        limit: i64,
        locale: &str,
    ) -> AppResult<Vec<PostListItem>> {
        let title_expr = title_cols(locale);
        let excerpt_expr = excerpt_cols(locale);

        // Try explicit related first
        let sql_explicit = format!(
            "SELECT \
                p.id, p.slug, \
                {title_expr} AS title, \
                {excerpt_expr} AS excerpt, \
                p.cover_url, \
                p.tags, p.reading_time, p.published_at, p.views_count, p.is_featured, \
                pc.id AS category_id, pc.slug AS category_slug, \
                pc.name_ru AS category_name_ru, pc.name_kg AS category_name_kg, pc.name_en AS category_name_en, \
                pa.id AS author_id, pa.name AS author_name, pa.bio AS author_bio, \
                pa.avatar_url AS author_avatar, pa.role AS author_role, pa.socials AS author_socials \
             FROM post_related pr \
             JOIN posts p ON p.id = pr.related_post_id \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id \
             WHERE pr.post_id = $1 AND p.status = 'published' \
             ORDER BY pr.sort_order ASC LIMIT $2"
        );
        let rows = sqlx::query(&sql_explicit)
            .bind(post_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;
        if !rows.is_empty() {
            return Ok(rows.iter().map(|r| row_to_list_item(r, locale)).collect());
        }

        // Fallback: posts in same category
        let sql_fallback = format!(
            "SELECT \
                p.id, p.slug, \
                {title_expr} AS title, \
                {excerpt_expr} AS excerpt, \
                p.cover_url, \
                p.tags, p.reading_time, p.published_at, p.views_count, p.is_featured, \
                pc.id AS category_id, pc.slug AS category_slug, \
                pc.name_ru AS category_name_ru, pc.name_kg AS category_name_kg, pc.name_en AS category_name_en, \
                pa.id AS author_id, pa.name AS author_name, pa.bio AS author_bio, \
                pa.avatar_url AS author_avatar, pa.role AS author_role, pa.socials AS author_socials \
             FROM posts p \
             LEFT JOIN post_categories pc ON p.category_id = pc.id \
             LEFT JOIN post_authors pa ON p.author_id = pa.id \
             WHERE p.status = 'published' AND p.id <> $1 \
             AND (p.category_id IS NULL OR p.category_id = (SELECT category_id FROM posts WHERE id = $1)) \
             ORDER BY p.published_at DESC NULLS LAST LIMIT $2"
        );
        let rows = sqlx::query(&sql_fallback)
            .bind(post_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.iter().map(|r| row_to_list_item(r, locale)).collect())
    }

    pub async fn track_view(
        &self,
        post_id: Uuid,
        user_id: Option<Uuid>,
        ip_hash: Option<String>,
        referrer: Option<String>,
    ) {
        let pool = self.pool.clone();
        tokio::spawn(async move {
            let _ = sqlx::query(
                "INSERT INTO post_views (post_id, user_id, ip_hash, referrer) VALUES ($1, $2, $3, $4)",
            )
            .bind(post_id)
            .bind(user_id)
            .bind(ip_hash)
            .bind(referrer)
            .execute(&pool)
            .await;

            let _ = sqlx::query("UPDATE posts SET views_count = views_count + 1 WHERE id = $1")
                .bind(post_id)
                .execute(&pool)
                .await;
        });
    }

    pub async fn like(&self, slug: &str) -> AppResult<i32> {
        let row = sqlx::query(
            "UPDATE posts SET likes_count = likes_count + 1 WHERE slug = $1 AND status = 'published' \
             RETURNING likes_count",
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound)?;
        Ok(row.try_get("likes_count")?)
    }
}

fn build_category(row: &sqlx::postgres::PgRow, locale: &str) -> Option<PostCategoryView> {
    let id: Option<Uuid> = row.try_get("category_id").ok()?;
    let slug: Option<String> = row.try_get("category_slug").ok()?;
    let name_ru: Option<String> = row.try_get("category_name_ru").ok()?;
    let name_kg: Option<String> = row.try_get("category_name_kg").ok()?;
    let name_en: Option<String> = row.try_get("category_name_en").ok()?;
    match (id, slug, name_ru) {
        (Some(id), Some(slug), Some(name_ru)) => {
            let name = match locale {
                "kg" => name_kg.clone().unwrap_or_else(|| name_ru.clone()),
                "en" => name_en.clone().unwrap_or_else(|| name_ru.clone()),
                _ => name_ru,
            };
            Some(PostCategoryView { id, slug, name, description: None })
        }
        _ => None,
    }
}

fn build_author(row: &sqlx::postgres::PgRow) -> Option<PostAuthor> {
    let id: Option<Uuid> = row.try_get("author_id").ok()?;
    let name: Option<String> = row.try_get("author_name").ok()?;
    match (id, name) {
        (Some(id), Some(name)) => Some(PostAuthor {
            id,
            name,
            bio: row.try_get("author_bio").ok().flatten(),
            avatar_url: row.try_get("author_avatar").ok().flatten(),
            role: row.try_get("author_role").ok().flatten(),
            socials: row
                .try_get::<serde_json::Value, _>("author_socials")
                .unwrap_or(serde_json::Value::Object(serde_json::Map::new())),
        }),
        _ => None,
    }
}

fn row_to_list_item(row: &sqlx::postgres::PgRow, locale: &str) -> PostListItem {
    PostListItem {
        id: row.try_get("id").unwrap(),
        slug: row.try_get("slug").unwrap(),
        title: row.try_get("title").unwrap(),
        excerpt: row.try_get("excerpt").ok().flatten(),
        cover_url: row.try_get("cover_url").ok().flatten(),
        category: build_category(row, locale),
        author: build_author(row),
        tags: row.try_get("tags").unwrap_or_default(),
        reading_time: row.try_get("reading_time").ok().flatten(),
        published_at: row.try_get("published_at").ok().flatten(),
        views_count: row.try_get("views_count").unwrap_or(0),
        is_featured: row.try_get("is_featured").unwrap_or(false),
    }
}

#[allow(dead_code)]
pub fn calculate_reading_time(content: &serde_json::Value) -> i32 {
    let words_per_minute = 200;
    let mut total_words = 0usize;
    if let Some(blocks) = content.as_array() {
        for block in blocks {
            let block_type = block.get("type").and_then(|t| t.as_str()).unwrap_or("");
            match block_type {
                "paragraph" | "heading" | "quote" | "callout" => {
                    if let Some(text) = block
                        .get("data")
                        .and_then(|d| d.get("text"))
                        .and_then(|t| t.as_str())
                    {
                        total_words += text.split_whitespace().count();
                    }
                }
                "list" => {
                    if let Some(items) = block
                        .get("data")
                        .and_then(|d| d.get("items"))
                        .and_then(|i| i.as_array())
                    {
                        for item in items {
                            if let Some(text) = item.as_str() {
                                total_words += text.split_whitespace().count();
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }
    let minutes = (total_words as f64) / (words_per_minute as f64);
    minutes.ceil().max(1.0) as i32
}
