//! Transactional email via SMTP (Resend, AWS SES, anything compatible).
//!
//! All public methods are safe to call without SMTP configured — they log a
//! warning and return Ok(()) so dev environments keep working without secrets.

use lettre::message::{header::ContentType, Mailbox, Message};
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::{Tls, TlsParameters};
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct EmailService {
    inner: Option<EmailInner>,
}

#[derive(Clone)]
struct EmailInner {
    transport: AsyncSmtpTransport<Tokio1Executor>,
    from: Mailbox,
    site_url: String,
    site_name: String,
}

impl EmailService {
    /// Builds the transport from env. Returns a disabled instance if SMTP is
    /// not configured — caller behaves the same, but emails go to logs only.
    pub fn from_env(site_url: &str, site_name: &str) -> Self {
        let (host, port, user, pass, from_raw) = match (
            std::env::var("SMTP_HOST").ok().filter(|s| !s.is_empty()),
            std::env::var("SMTP_PORT").ok().and_then(|s| s.parse::<u16>().ok()),
            std::env::var("SMTP_USER").ok(),
            std::env::var("SMTP_PASS").ok(),
            std::env::var("SMTP_FROM").ok().filter(|s| !s.is_empty()),
        ) {
            (Some(h), Some(p), Some(u), Some(pa), Some(f)) => (h, p, u, pa, f),
            _ => {
                tracing::warn!("SMTP_* env vars not fully set — email delivery disabled");
                return Self { inner: None };
            }
        };

        let from = match from_raw.parse::<Mailbox>() {
            Ok(mb) => mb,
            Err(e) => {
                tracing::warn!(error = %e, "SMTP_FROM is not a valid mailbox; email disabled");
                return Self { inner: None };
            }
        };

        let tls = match TlsParameters::new(host.clone()) {
            Ok(t) => t,
            Err(e) => {
                tracing::warn!(error = %e, "TLS params build failed; email disabled");
                return Self { inner: None };
            }
        };

        let transport = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&host)
            .port(port)
            .credentials(Credentials::new(user, pass))
            .tls(if port == 465 { Tls::Wrapper(tls) } else { Tls::Required(tls) })
            .build();

        tracing::info!(target: "email", %host, port, "SMTP configured");
        Self {
            inner: Some(EmailInner {
                transport,
                from,
                site_url: site_url.to_string(),
                site_name: site_name.to_string(),
            }),
        }
    }

    pub fn disabled() -> Self {
        Self { inner: None }
    }

    pub fn enabled(&self) -> bool {
        self.inner.is_some()
    }

    /// Sends the email verification link. Token is the random string from
    /// `email_verification_tokens.token`.
    pub async fn send_verification(&self, to: &str, token: &str) -> AppResult<()> {
        let Some(inner) = &self.inner else {
            tracing::warn!(target: "email", to, "skipping verification email — SMTP disabled");
            return Ok(());
        };

        let url = format!("{}/verify-email?token={}", inner.site_url.trim_end_matches('/'), token);
        let subject = format!("Подтвердите email — {}", inner.site_name);
        let html = render_verification_html(&inner.site_name, &url);
        let text = render_verification_text(&inner.site_name, &url);

        self.send(&inner.from.clone(), to, &subject, &html, &text).await
    }

    async fn send(
        &self,
        from: &Mailbox,
        to: &str,
        subject: &str,
        html: &str,
        text: &str,
    ) -> AppResult<()> {
        let Some(inner) = &self.inner else {
            return Ok(());
        };

        let to_mailbox: Mailbox = to
            .parse()
            .map_err(|e| AppError::Validation(format!("invalid recipient: {e}")))?;

        let email = Message::builder()
            .from(from.clone())
            .to(to_mailbox)
            .subject(subject)
            .multipart(
                lettre::message::MultiPart::alternative()
                    .singlepart(
                        lettre::message::SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text.to_string()),
                    )
                    .singlepart(
                        lettre::message::SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html.to_string()),
                    ),
            )
            .map_err(|e| AppError::Internal(format!("email build: {e}")))?;

        match inner.transport.send(email).await {
            Ok(_) => {
                tracing::info!(target: "email", to, subject, "sent");
                Ok(())
            }
            Err(e) => {
                tracing::warn!(target: "email", to, error = %e, "send failed");
                Err(AppError::Internal(format!("smtp send: {e}")))
            }
        }
    }
}

fn render_verification_html(site_name: &str, url: &str) -> String {
    format!(
        r#"<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><title>Подтвердите email</title></head>
<body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background:#f7f7f5; padding:32px;">
  <div style="max-width:540px; margin:0 auto; background:#fff; border-radius:14px; padding:32px; border:1px solid #ececec;">
    <h1 style="font-size:22px; margin:0 0 16px; color:#1a1a1a;">Подтвердите email</h1>
    <p style="font-size:15px; line-height:1.55; color:#3a3a3a; margin:0 0 20px;">
      Здравствуйте! Вы зарегистрировались на платформе <strong>{site_name}</strong>.
      Нажмите кнопку ниже, чтобы подтвердить, что этот email принадлежит вам.
    </p>
    <p style="margin:0 0 28px;">
      <a href="{url}" style="display:inline-block; padding:12px 22px; background:#ee7c4e; color:#fff;
         text-decoration:none; font-weight:600; border-radius:999px;">Подтвердить email</a>
    </p>
    <p style="font-size:13px; color:#666; line-height:1.55; margin:0 0 8px;">
      Если кнопка не работает, скопируйте ссылку в браузер:
    </p>
    <p style="font-size:13px; color:#444; word-break:break-all; margin:0 0 24px;">
      <a href="{url}" style="color:#ee7c4e;">{url}</a>
    </p>
    <hr style="border:none; border-top:1px solid #ececec; margin:24px 0;">
    <p style="font-size:12px; color:#888; margin:0;">
      Ссылка действительна 24 часа. Если вы не регистрировались на {site_name},
      просто проигнорируйте это письмо.
    </p>
  </div>
</body>
</html>"#
    )
}

fn render_verification_text(site_name: &str, url: &str) -> String {
    format!(
        "Здравствуйте!\n\n\
         Вы зарегистрировались на платформе {site_name}. Чтобы подтвердить email, перейдите по ссылке:\n\n\
         {url}\n\n\
         Ссылка действительна 24 часа. Если вы не регистрировались — проигнорируйте это письмо."
    )
}
