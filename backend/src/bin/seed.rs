use std::collections::HashMap;

use backend::auth::password::hash_password;
use backend::config::Config;
use backend::db;
use backend::utils::slugify::{generate_slug, unique_tutor_slug};
use rand::seq::SliceRandom;
use rand::Rng;
use sqlx::PgPool;
use uuid::Uuid;

const PASSWORD: &str = "Tutor1234!";

const NAMES: &[(&str, &str, &str)] = &[
    // (name, surname, gender)
    ("Айгерим", "Асанова", "f"),
    ("Бакыт", "Жумабеков", "m"),
    ("Чолпон", "Иманкулова", "f"),
    ("Данияр", "Карасартов", "m"),
    ("Эльмира", "Турдубекова", "f"),
    ("Тимур", "Осмонов", "m"),
    ("Назгуль", "Мамытова", "f"),
    ("Алмаз", "Бекмуратов", "m"),
    ("Гулзат", "Сатыбалдиева", "f"),
    ("Эрлан", "Дуйшеев", "m"),
    ("Бегимай", "Усенова", "f"),
    ("Нурлан", "Айдаров", "m"),
    ("Жанара", "Кадырова", "f"),
    ("Адилет", "Сыдыков", "m"),
    ("Толгонай", "Молдалиева", "f"),
    ("Анна", "Петрова", "f"),
    ("Дмитрий", "Иванов", "m"),
    ("Екатерина", "Смирнова", "f"),
    ("Александр", "Кузнецов", "m"),
    ("Мария", "Соколова", "f"),
    ("Sarah", "Johnson", "f"),
    ("Michael", "Brown", "m"),
    ("Emma", "Davis", "f"),
    ("James", "Wilson", "m"),
    ("Olivia", "Taylor", "f"),
    ("Айдай", "Рысбаева", "f"),
    ("Самат", "Кубанычбеков", "m"),
    ("Айсулуу", "Эркинбаева", "f"),
    ("Канат", "Бакиров", "m"),
    ("Венера", "Тологонова", "f"),
];

const SUBJECTS_FOR_TUTOR: &[&[&str]] = &[
    &["english"],
    &["math", "physics"],
    &["english", "russian"],
    &["chemistry", "biology"],
    &["kyrgyz"],
    &["math"],
    &["english"],
    &["russian", "russian"],
    &["history", "geography"],
    &["informatics", "math"],
    &["english"],
    &["physics", "math"],
    &["chemistry"],
    &["preschool"],
    &["english"],
    &["math"],
    &["russian"],
    &["english", "russian"],
    &["physics"],
    &["math", "informatics"],
    &["english"],
    &["english"],
    &["english"],
    &["english"],
    &["english"],
    &["music"],
    &["art"],
    &["biology", "chemistry"],
    &["english", "math"],
    &["kyrgyz", "russian"],
];

const GOALS: &[&str] = &[
    "school_subjects",
    "ort",
    "ielts",
    "toefl",
    "conversational",
    "business",
    "kids",
    "adults",
    "exam_prep",
    "olympiad",
];

const FORMATS: &[&str] = &["online", "at_tutor", "at_student"];

const AGE_GROUPS: &[&str] = &["preschool", "primary", "middle", "high", "students", "adults"];

const LANGUAGES: &[&str] = &["ru", "kg", "en"];

const SHORT_BIOS: &[&str] = &[
    "Преподаю английский с акцентом на разговорную практику и подготовку к IELTS.",
    "Помогу подтянуть математику для ОРТ и ЕГЭ. 8 лет опыта.",
    "Native speaker. Conversational English for adults and teens.",
    "Готовлю к олимпиадам по физике. Призёр республиканских.",
    "Подготовка к школе: чтение, счёт, развитие речи.",
    "Кыргыз тилин үйрөтөм. Балдар жана чоңдор үчүн.",
    "Химия и биология для медицинских вузов.",
    "Программирование на Python для школьников и студентов.",
    "Русский язык: грамотность, сочинения, ОРТ.",
    "История и обществознание. Подготовка к экзаменам.",
    "Музыка: фортепиано, сольфеджио, теория.",
    "Рисование и композиция. Поступление в худож. вузы.",
    "Бизнес-английский: переговоры, презентации, переписка.",
    "TOEFL prep with 95%+ pass rate. 6 years experience.",
    "Geography & History — engaging lessons for teenagers.",
];

const BIOS: &[&str] = &[
    "Закончила КНУ им. Баласагына, факультет иностранных языков. Преподаю с 2016 года, провела более 2000 индивидуальных уроков. Специализируюсь на подготовке к международным экзаменам.",
    "Выпускник МФТИ, кандидат физ-мат наук. Готовил победителей республиканских олимпиад. Объясняю сложные темы простым языком.",
    "Born and raised in London, taught English in Bishkek for the past 4 years. I focus on natural conversation and pronunciation. Patient with all levels.",
    "Учитель высшей категории, 15 лет в школе и 7 лет частных уроков. Знаю все требования ОРТ и ЕГЭ.",
    "Психолог-педагог по образованию, специализируюсь на дошколятах. Учу читать, писать, считать через игру.",
    "MBA выпускник AUCA. Преподаю Business English уже 5 лет. Опыт работы в международных компаниях.",
];

const SCHEDULE_OPTIONS: &[&str] = &[
    "Будни 16:00–21:00, выходные 10:00–18:00",
    "Понедельник–пятница после 17:00",
    "Гибкий график, согласовываем индивидуально",
    "Утренние и вечерние слоты доступны",
];

const DISTRICTS: &[&[&str]] = &[
    &["Центр", "Восток-5"],
    &["Джал", "Асанбай"],
    &["12-й микрорайон", "Тунгуч"],
    &["Аламедин-1"],
    &[],
];

const INSTITUTIONS: &[&str] = &[
    "КНУ им. Баласагына",
    "АУЦА",
    "КГУСТА",
    "КРСУ",
    "МГУ",
    "Cambridge University",
    "Oxford University",
    "МФТИ",
    "СПбГУ",
];

const SPECIALTIES: &[&str] = &[
    "Английская филология",
    "Прикладная математика",
    "Педагогика начального образования",
    "Лингвистика",
    "Физика",
    "Химия",
    "Биология",
    "История",
    "TESOL",
];

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let cfg = Config::from_env()?;
    let pool = db::init_pool(&cfg.database_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    seed_tutors(&pool).await?;
    tracing::info!("seed done");
    Ok(())
}

async fn seed_tutors(pool: &PgPool) -> anyhow::Result<()> {
    let cities: Vec<(Uuid, String)> = sqlx::query_as("SELECT id, slug FROM cities")
        .fetch_all(pool)
        .await?;
    let subjects: Vec<(Uuid, String)> = sqlx::query_as("SELECT id, slug FROM subjects")
        .fetch_all(pool)
        .await?;
    let subj_by_slug: HashMap<String, Uuid> = subjects.into_iter().map(|(id, s)| (s, id)).collect();

    let password_hash = hash_password(PASSWORD)
        .map_err(|e| anyhow::anyhow!("password hash: {e}"))?;

    let mut rng = rand::thread_rng();
    for i in 0..NAMES.len() {
        let (first, last, _gender) = NAMES[i];
        let email = format!("tutor{}@repka.dev", i + 1);
        let phone = format!("+9967{:08}", 10_000_000u64 + i as u64 * 13_579);

        let existing: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM users WHERE email = $1 OR phone = $2")
                .bind(&email)
                .bind(&phone)
                .fetch_optional(pool)
                .await?;
        if existing.is_some() {
            tracing::info!(%email, "skipping existing user");
            continue;
        }

        let user_id: Uuid = sqlx::query_scalar(
            "INSERT INTO users (email, phone, password_hash, name, surname, roles, locale, email_verified, phone_verified) \
             VALUES ($1, $2, $3, $4, $5, ARRAY['tutor']::TEXT[], 'ru', TRUE, TRUE) \
             RETURNING id",
        )
        .bind(&email)
        .bind(&phone)
        .bind(&password_hash)
        .bind(first)
        .bind(last)
        .fetch_one(pool)
        .await?;

        let subject_slugs = SUBJECTS_FOR_TUTOR[i];
        let primary_subject = subject_slugs.first().copied();
        let base = generate_slug(first, last, primary_subject);
        let slug = unique_tutor_slug(pool, &base).await?;

        let city_id = cities.choose(&mut rng).map(|(id, _)| *id);
        let price_per_60: i32 = match rng.gen_range(0..10) {
            0..=2 => rng.gen_range(400..700),
            3..=6 => rng.gen_range(700..1500),
            7..=8 => rng.gen_range(1500..2500),
            _ => rng.gen_range(2500..4000),
        };
        let price_per_90 = (price_per_60 as f64 * 1.4) as i32;
        let experience = rng.gen_range(1..=25);
        let is_native = (20..=24).contains(&i); // англ. native группа
        let trial = rng.gen_bool(0.6);
        let video_url = if rng.gen_bool(0.3) {
            Some(format!("https://example.com/videos/{}.mp4", i))
        } else {
            None
        };
        let photo_url = format!("https://i.pravatar.cc/300?img={}", (i % 70) + 1);
        let short_bio = SHORT_BIOS.choose(&mut rng).copied().unwrap_or("");
        let bio = BIOS.choose(&mut rng).copied().unwrap_or("");
        let schedule = SCHEDULE_OPTIONS.choose(&mut rng).copied().unwrap_or("");
        let districts = DISTRICTS.choose(&mut rng).copied().unwrap_or(&[]);
        let mut badges = vec!["verified".to_string()];
        if experience >= 5 {
            badges.push("experienced".to_string());
        }
        if rng.gen_bool(0.25) {
            badges.push("popular".to_string());
        }
        let rating: rust_decimal::Decimal = {
            let v = 4.0 + rng.gen::<f64>();
            rust_decimal::Decimal::from_f64_retain(v)
                .map(|d| d.round_dp(2))
                .unwrap_or_default()
        };
        let reviews_count: i32 = rng.gen_range(0..80);
        let views_count: i32 = rng.gen_range(20..2000);
        let specializations: Vec<String> = match primary_subject {
            Some("english") => vec!["IELTS".into(), "Conversational".into()],
            Some("math") => vec!["ОРТ".into(), "Олимпиады".into()],
            Some("physics") => vec!["ОРТ".into()],
            _ => vec![],
        };

        let tutor_id: Uuid = sqlx::query_scalar(
            "INSERT INTO tutor_profiles ( \
                user_id, slug, bio, short_bio, photo_url, video_url, \
                is_native_speaker, experience_years, specializations, \
                city_id, address, student_districts, schedule_text, \
                price_per_60, price_per_90, currency, trial_enabled, \
                contact_phone, contact_whatsapp, contact_telegram, contact_email, contact_instagram, \
                status, verified, badges, views_count, rating, reviews_count \
             ) VALUES ( \
                $1, $2, $3, $4, $5, $6, \
                $7, $8, $9, \
                $10, $11, $12, $13, \
                $14, $15, 'KGS', $16, \
                $17, $18, $19, $20, $21, \
                'active', TRUE, $22, $23, $24, $25 \
             ) RETURNING id",
        )
        .bind(user_id)
        .bind(&slug)
        .bind(bio)
        .bind(short_bio)
        .bind(&photo_url)
        .bind(&video_url)
        .bind(is_native)
        .bind(experience)
        .bind(&specializations)
        .bind(city_id)
        .bind(Some(format!("ул. Чуй, {}", rng.gen_range(1..200))))
        .bind(districts.iter().map(|s| s.to_string()).collect::<Vec<_>>())
        .bind(schedule)
        .bind(price_per_60)
        .bind(price_per_90)
        .bind(trial)
        .bind(&phone)
        .bind(if rng.gen_bool(0.85) { Some(phone.clone()) } else { None })
        .bind(if rng.gen_bool(0.7) {
            Some(format!("@{}_tutor", slug.replace('-', "_")))
        } else {
            None
        })
        .bind(&email)
        .bind(if rng.gen_bool(0.3) {
            Some(format!("@{}_studio", slug.replace('-', "_")))
        } else {
            None
        })
        .bind(&badges)
        .bind(views_count)
        .bind(rating)
        .bind(reviews_count)
        .fetch_one(pool)
        .await?;

        for s in subject_slugs.iter() {
            if let Some(subject_id) = subj_by_slug.get(*s) {
                sqlx::query(
                    "INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES ($1, $2) \
                     ON CONFLICT DO NOTHING",
                )
                .bind(tutor_id)
                .bind(subject_id)
                .execute(pool)
                .await?;
            }
        }

        // goals: 1–3
        let goal_count = rng.gen_range(1..=3);
        let mut chosen_goals: Vec<&str> = GOALS.choose_multiple(&mut rng, goal_count).copied().collect();
        chosen_goals.dedup();
        for g in &chosen_goals {
            sqlx::query(
                "INSERT INTO tutor_goals (tutor_id, goal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(tutor_id)
            .bind(*g)
            .execute(pool)
            .await?;
        }

        // formats: 1–3
        let format_count = rng.gen_range(1..=3);
        let mut chosen_formats: Vec<&str> = FORMATS
            .choose_multiple(&mut rng, format_count)
            .copied()
            .collect();
        chosen_formats.dedup();
        for f in &chosen_formats {
            sqlx::query(
                "INSERT INTO tutor_formats (tutor_id, format_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(tutor_id)
            .bind(*f)
            .execute(pool)
            .await?;
        }

        // age groups: 1–3
        let ag_count = rng.gen_range(1..=3);
        let mut chosen_ag: Vec<&str> = AGE_GROUPS
            .choose_multiple(&mut rng, ag_count)
            .copied()
            .collect();
        chosen_ag.dedup();
        for a in &chosen_ag {
            sqlx::query(
                "INSERT INTO tutor_age_groups (tutor_id, age_group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(tutor_id)
            .bind(*a)
            .execute(pool)
            .await?;
        }

        // languages: ru always, kg/en sometimes
        for lang in LANGUAGES {
            let include = match *lang {
                "ru" => true,
                "kg" => rng.gen_bool(0.6),
                "en" => is_native || rng.gen_bool(0.5),
                _ => false,
            };
            if include {
                let level = if *lang == "en" && is_native {
                    Some("native")
                } else if rng.gen_bool(0.5) {
                    Some("fluent")
                } else {
                    Some("intermediate")
                };
                sqlx::query(
                    "INSERT INTO tutor_languages (tutor_id, language_code, level) VALUES ($1, $2, $3) \
                     ON CONFLICT DO NOTHING",
                )
                .bind(tutor_id)
                .bind(*lang)
                .bind(level)
                .execute(pool)
                .await?;
            }
        }

        // education: 1–2 entries
        let edu_count = rng.gen_range(1..=2);
        for k in 0..edu_count {
            let inst = INSTITUTIONS.choose(&mut rng).copied().unwrap_or("");
            let spec = SPECIALTIES.choose(&mut rng).copied().unwrap_or("");
            let yr_start = rng.gen_range(2000..=2018);
            let yr_end = yr_start + rng.gen_range(3..=6);
            sqlx::query(
                "INSERT INTO tutor_education (tutor_id, institution, specialty, year_start, year_end, sort_order) \
                 VALUES ($1, $2, $3, $4, $5, $6)",
            )
            .bind(tutor_id)
            .bind(inst)
            .bind(spec)
            .bind(yr_start)
            .bind(yr_end)
            .bind(k as i32)
            .execute(pool)
            .await?;
        }

        // experience: 0–2 entries
        let exp_count = rng.gen_range(0..=2);
        for k in 0..exp_count {
            let yr_start = rng.gen_range(2010..=2022);
            let yr_end = if rng.gen_bool(0.4) {
                None
            } else {
                Some(yr_start + rng.gen_range(1..=5))
            };
            sqlx::query(
                "INSERT INTO tutor_experience (tutor_id, position, company, year_start, year_end, sort_order) \
                 VALUES ($1, $2, $3, $4, $5, $6)",
            )
            .bind(tutor_id)
            .bind("Преподаватель")
            .bind(format!("Школа №{}", rng.gen_range(1..100)))
            .bind(yr_start)
            .bind(yr_end)
            .bind(k as i32)
            .execute(pool)
            .await?;
        }

        tracing::info!(%email, %slug, "tutor seeded");
    }

    Ok(())
}
