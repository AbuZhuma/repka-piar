use serde::Serialize;

use crate::models::tutor::ContactsRevealed;

#[derive(Debug, Serialize)]
pub struct ContactLinks {
    pub phone_tel: Option<String>,
    pub whatsapp_url: Option<String>,
    pub telegram_url: Option<String>,
    pub email_mailto: Option<String>,
    pub instagram_url: Option<String>,
}

pub fn build_contact_links(c: &ContactsRevealed) -> ContactLinks {
    ContactLinks {
        phone_tel: c.phone.as_ref().map(|p| format!("tel:{}", p)),
        whatsapp_url: c.whatsapp.as_ref().map(|p| {
            let phone_clean: String = p.chars().filter(|ch| ch.is_ascii_digit()).collect();
            let message = urlencoding::encode(
                "Здравствуйте! Я нашёл вас на Repka. Хочу узнать подробнее о занятиях.",
            );
            format!("https://wa.me/{}?text={}", phone_clean, message)
        }),
        telegram_url: c.telegram.as_ref().map(|t| {
            let username = t.trim_start_matches('@');
            let username = username.trim_start_matches("https://t.me/");
            format!("https://t.me/{}", username)
        }),
        email_mailto: c.email.as_ref().map(|e| {
            let subject = urlencoding::encode("Repka — занятия");
            format!("mailto:{}?subject={}", e, subject)
        }),
        instagram_url: c.instagram.as_ref().map(|i| {
            let username = i.trim_start_matches('@');
            let username = username.trim_start_matches("https://instagram.com/");
            format!("https://instagram.com/{}", username)
        }),
    }
}
