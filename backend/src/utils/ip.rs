use std::net::SocketAddr;

use axum::http::HeaderMap;
use sha2::{Digest, Sha256};

pub fn get_client_ip(headers: &HeaderMap, addr: &SocketAddr) -> String {
    let candidates = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"];
    for h in &candidates {
        if let Some(v) = headers.get(*h).and_then(|v| v.to_str().ok()) {
            if let Some(first) = v.split(',').next() {
                let trimmed = first.trim();
                if !trimmed.is_empty() {
                    return trimmed.to_string();
                }
            }
        }
    }
    addr.ip().to_string()
}

pub fn hash_ip(ip: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(ip.as_bytes());
    hasher.update(b"|");
    hasher.update(salt.as_bytes());
    let digest = hasher.finalize();
    let hex = format!("{:x}", digest);
    hex[..16].to_string()
}
