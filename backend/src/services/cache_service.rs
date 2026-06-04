use std::time::Duration;

use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use serde::de::DeserializeOwned;
use serde::Serialize;

/// A small wrapper around Redis. All operations degrade gracefully — if Redis
/// is unavailable, reads return `None`, writes silently no-op, and the caller
/// behaves as if there was a cache miss.
#[derive(Clone)]
pub struct Cache {
    inner: Option<ConnectionManager>,
    default_ttl: Duration,
}

impl Cache {
    pub async fn connect(url: &str, default_ttl: Duration) -> Self {
        match Self::try_connect(url).await {
            Ok(conn) => {
                tracing::info!(target: "cache", "redis connected");
                Self {
                    inner: Some(conn),
                    default_ttl,
                }
            }
            Err(e) => {
                tracing::warn!(target: "cache", error = %e, "redis unavailable; cache disabled");
                Self {
                    inner: None,
                    default_ttl,
                }
            }
        }
    }

    pub fn disabled() -> Self {
        Self {
            inner: None,
            default_ttl: Duration::from_secs(60),
        }
    }

    async fn try_connect(url: &str) -> Result<ConnectionManager, redis::RedisError> {
        let client = redis::Client::open(url)?;
        ConnectionManager::new(client).await
    }

    pub fn enabled(&self) -> bool {
        self.inner.is_some()
    }

    pub fn default_ttl(&self) -> Duration {
        self.default_ttl
    }

    pub async fn get<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        let mut conn = self.inner.clone()?;
        let raw: Option<String> = conn.get(key).await.ok()?;
        let raw = raw?;
        match serde_json::from_str::<T>(&raw) {
            Ok(v) => Some(v),
            Err(e) => {
                tracing::warn!(target: "cache", key, error = %e, "decode failed; treating as miss");
                let _: Result<(), _> = conn.del(key).await;
                None
            }
        }
    }

    pub async fn set<T: Serialize>(&self, key: &str, value: &T, ttl: Option<Duration>) {
        let Some(mut conn) = self.inner.clone() else {
            return;
        };
        let raw = match serde_json::to_string(value) {
            Ok(s) => s,
            Err(e) => {
                tracing::warn!(target: "cache", key, error = %e, "encode failed; skipping write");
                return;
            }
        };
        let ttl_secs = ttl.unwrap_or(self.default_ttl).as_secs().max(1);
        let res: Result<(), _> = conn.set_ex(key, raw, ttl_secs).await;
        if let Err(e) = res {
            tracing::warn!(target: "cache", key, error = %e, "set failed");
        }
    }

    /// Delete one or many keys. Patterns are NOT supported here — use
    /// [`invalidate_prefix`] for prefix-based invalidation.
    pub async fn del(&self, keys: &[&str]) {
        let Some(mut conn) = self.inner.clone() else {
            return;
        };
        if keys.is_empty() {
            return;
        }
        let res: Result<(), _> = conn.del(keys).await;
        if let Err(e) = res {
            tracing::warn!(target: "cache", error = %e, "del failed");
        }
    }

    /// Best-effort prefix invalidation via SCAN + DEL in batches. Safe against
    /// large keyspaces (does not use KEYS *).
    pub async fn invalidate_prefix(&self, prefix: &str) {
        let Some(mut conn) = self.inner.clone() else {
            return;
        };
        let pattern = format!("{prefix}*");
        let mut cursor: u64 = 0;
        loop {
            let result: Result<(u64, Vec<String>), _> = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg(&pattern)
                .arg("COUNT")
                .arg(200)
                .query_async(&mut conn)
                .await;
            let (next, keys) = match result {
                Ok(v) => v,
                Err(e) => {
                    tracing::warn!(target: "cache", error = %e, "scan failed");
                    return;
                }
            };
            if !keys.is_empty() {
                let _: Result<(), _> = conn.del(&keys).await;
            }
            if next == 0 {
                break;
            }
            cursor = next;
        }
    }
}
