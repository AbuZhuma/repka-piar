//! Stable cache key prefixes and TTLs. Centralised so write-side invalidation
//! and read-side lookups can't drift apart.

use std::time::Duration;

pub const PREFIX_DICTIONARIES: &str = "dict:";
pub const PREFIX_TUTOR_LIST: &str = "tutor:list:";
pub const PREFIX_TUTOR_BY_SLUG: &str = "tutor:slug:";
pub const PREFIX_TUTOR_SIMILAR: &str = "tutor:similar:";
pub const PREFIX_POST_LIST: &str = "post:list:";
pub const PREFIX_POST_BY_SLUG: &str = "post:slug:";
/// Aggregated public counters (tutors_total, subjects_total, ...).
/// Single key, no prefix children, but still wiped on every relevant mutation.
pub const KEY_STATS: &str = "stats:platform";

pub const TTL_DICTIONARIES: Duration = Duration::from_secs(300);
pub const TTL_TUTORS: Duration = Duration::from_secs(60);
pub const TTL_POSTS: Duration = Duration::from_secs(120);

pub fn dict_all() -> String {
    format!("{PREFIX_DICTIONARIES}all")
}

pub fn dict_cities() -> String {
    format!("{PREFIX_DICTIONARIES}cities")
}

pub fn dict_subjects() -> String {
    format!("{PREFIX_DICTIONARIES}subjects")
}

pub fn tutor_list(query: &str) -> String {
    format!("{PREFIX_TUTOR_LIST}{}", normalize(query))
}

pub fn tutor_by_slug(slug: &str) -> String {
    format!("{PREFIX_TUTOR_BY_SLUG}{slug}")
}

pub fn tutor_similar(slug: &str, limit: u32) -> String {
    format!("{PREFIX_TUTOR_SIMILAR}{slug}:{limit}")
}

pub fn post_list(query: &str) -> String {
    format!("{PREFIX_POST_LIST}{}", normalize(query))
}

pub fn post_by_slug(slug: &str, locale: &str) -> String {
    format!("{PREFIX_POST_BY_SLUG}{slug}:{locale}")
}

fn normalize(s: &str) -> String {
    let trimmed = s.trim_matches('?');
    if trimmed.is_empty() {
        "default".to_string()
    } else {
        trimmed.to_string()
    }
}

use super::cache_service::Cache;

/// Drop the platform-stats counter. Cheap (single key).
async fn purge_stats(cache: &Cache) {
    cache.del(&[KEY_STATS]).await;
}

/// Wipe every dictionary cache entry. Cheap — fewer than 5 keys total.
pub async fn purge_dictionaries(cache: &Cache) {
    cache.invalidate_prefix(PREFIX_DICTIONARIES).await;
    purge_stats(cache).await;
}

/// Wipe every tutor-derived cache entry: list, by-slug, similar.
/// Called from any write that affects tutor discovery or profile contents.
pub async fn purge_tutors(cache: &Cache) {
    cache.invalidate_prefix(PREFIX_TUTOR_LIST).await;
    cache.invalidate_prefix(PREFIX_TUTOR_BY_SLUG).await;
    cache.invalidate_prefix(PREFIX_TUTOR_SIMILAR).await;
    purge_stats(cache).await;
}

/// Wipe every post-derived cache entry.
pub async fn purge_posts(cache: &Cache) {
    cache.invalidate_prefix(PREFIX_POST_LIST).await;
    cache.invalidate_prefix(PREFIX_POST_BY_SLUG).await;
    purge_stats(cache).await;
}
