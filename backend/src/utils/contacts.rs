use crate::models::tutor::{ContactsMasked, ContactsRevealed, TutorProfile};

pub fn mask_phone(phone: &str) -> String {
    let chars: Vec<char> = phone.chars().collect();
    if chars.len() < 6 {
        return "•••".into();
    }
    let prefix: String = chars.iter().take(6).collect();
    let visible: String = chars.iter().rev().take(2).collect::<String>().chars().rev().collect();
    format!("{}••• ••• •{}", prefix, visible)
}

pub fn mask_email(email: &str) -> String {
    let parts: Vec<&str> = email.splitn(2, '@').collect();
    if parts.len() != 2 {
        return "•••@•••".into();
    }
    let (local, domain) = (parts[0], parts[1]);
    let local_masked = if local.chars().count() <= 2 {
        "•".repeat(local.chars().count())
    } else {
        let first: String = local.chars().take(1).collect();
        let last: String = local.chars().rev().take(1).collect();
        format!("{}••••{}", first, last)
    };
    let domain_parts: Vec<&str> = domain.splitn(2, '.').collect();
    let domain_masked = if domain_parts.len() == 2 && !domain_parts[0].is_empty() {
        let first: String = domain_parts[0].chars().take(1).collect();
        format!("{}••••.{}", first, domain_parts[1])
    } else {
        domain.into()
    };
    format!("{}@{}", local_masked, domain_masked)
}

pub fn build_masked(profile: &TutorProfile) -> ContactsMasked {
    ContactsMasked {
        phone: profile.contact_phone.as_deref().map(mask_phone),
        whatsapp: profile.contact_whatsapp.is_some(),
        telegram: profile.contact_telegram.is_some(),
        email: profile.contact_email.as_deref().map(mask_email),
        instagram: profile.contact_instagram.is_some(),
    }
}

pub fn build_masked_from_fields(
    contact_phone: Option<&str>,
    contact_whatsapp: Option<&str>,
    contact_telegram: Option<&str>,
    contact_email: Option<&str>,
    contact_instagram: Option<&str>,
) -> ContactsMasked {
    ContactsMasked {
        phone: contact_phone.map(mask_phone),
        whatsapp: contact_whatsapp.is_some(),
        telegram: contact_telegram.is_some(),
        email: contact_email.map(mask_email),
        instagram: contact_instagram.is_some(),
    }
}

pub fn build_revealed(profile: &TutorProfile) -> ContactsRevealed {
    ContactsRevealed {
        phone: profile.contact_phone.clone(),
        whatsapp: profile.contact_whatsapp.clone(),
        telegram: profile.contact_telegram.clone(),
        email: profile.contact_email.clone(),
        instagram: profile.contact_instagram.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn masks_phone() {
        assert_eq!(mask_phone("+996555123456"), "+99655••• ••• •56");
    }

    #[test]
    fn masks_email() {
        assert_eq!(mask_email("aigerim@mail.com"), "a••••m@m••••.com");
    }

    #[test]
    fn masks_short_phone() {
        assert_eq!(mask_phone("12345"), "•••");
    }

    #[test]
    fn masks_two_letter_local() {
        assert_eq!(mask_email("ab@mail.com"), "••@m••••.com");
    }
}
