-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Справочник городов
CREATE TABLE cities (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug         VARCHAR(64) UNIQUE NOT NULL,
    name_ru      VARCHAR(128) NOT NULL,
    name_kg      VARCHAR(128),
    name_en      VARCHAR(128),
    country_code CHAR(2) NOT NULL DEFAULT 'KG',
    timezone     VARCHAR(64) NOT NULL DEFAULT 'Asia/Bishkek',
    lat          DOUBLE PRECISION,
    lng          DOUBLE PRECISION,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Справочник предметов
CREATE TABLE subjects (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug       VARCHAR(64) UNIQUE NOT NULL,
    name_ru    VARCHAR(128) NOT NULL,
    name_kg    VARCHAR(128),
    name_en    VARCHAR(128),
    icon       VARCHAR(16),
    category   VARCHAR(64),
    sort_order INT NOT NULL DEFAULT 0
);

-- Пользователи
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(32) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            VARCHAR(128) NOT NULL,
    surname         VARCHAR(128) NOT NULL,
    roles           TEXT[] NOT NULL DEFAULT ARRAY['tutor']::TEXT[],
    locale          VARCHAR(8) NOT NULL DEFAULT 'ru',
    timezone        VARCHAR(64) NOT NULL DEFAULT 'Asia/Bishkek',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;

-- Школы (Phase 2 готовность, на старте не используется)
CREATE TABLE schools (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(128) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    logo_url        TEXT,
    cover_url       TEXT,
    city_id         UUID REFERENCES cities(id),
    address         TEXT,
    phone           VARCHAR(32),
    email           VARCHAR(255),
    website         TEXT,
    founded_year    INT,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    featured        BOOLEAN NOT NULL DEFAULT FALSE,
    commission_rate NUMERIC(5,2),
    roles           JSONB NOT NULL DEFAULT '{"is_school": true}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Профили репетиторов
CREATE TABLE tutor_profiles (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    slug                 VARCHAR(255) UNIQUE NOT NULL,
    school_id            UUID REFERENCES schools(id),
    school_status        VARCHAR(32),

    bio                  TEXT,
    short_bio            TEXT,
    photo_url            TEXT,
    video_url            TEXT,

    is_native_speaker    BOOLEAN NOT NULL DEFAULT FALSE,
    experience_years     INT NOT NULL DEFAULT 0,
    specializations      TEXT[] NOT NULL DEFAULT '{}',

    city_id              UUID REFERENCES cities(id),
    address              TEXT,
    student_districts    TEXT[],
    schedule_text        TEXT,

    -- Цены
    price_per_60         INT,
    price_per_90         INT,
    currency             CHAR(3) NOT NULL DEFAULT 'KGS',
    trial_enabled        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Контакты
    contact_phone        VARCHAR(32),
    contact_whatsapp     VARCHAR(32),
    contact_telegram     VARCHAR(64),
    contact_email        VARCHAR(255),
    contact_instagram    VARCHAR(64),

    -- Статус
    status               VARCHAR(32) NOT NULL DEFAULT 'pending',
    verified             BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason     TEXT,

    -- Бейджи
    badges               TEXT[] NOT NULL DEFAULT '{}',

    -- Метрики
    views_count          INT NOT NULL DEFAULT 0,
    contact_clicks_count INT NOT NULL DEFAULT 0,
    rating               NUMERIC(3,2),
    reviews_count        INT NOT NULL DEFAULT 0,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tutors_status ON tutor_profiles(status);
CREATE INDEX idx_tutors_city ON tutor_profiles(city_id);
CREATE INDEX idx_tutors_price ON tutor_profiles(price_per_60);
CREATE INDEX idx_tutors_search ON tutor_profiles USING gin(short_bio gin_trgm_ops);

-- Связи tutor ↔ subjects
CREATE TABLE tutor_subjects (
    tutor_id   UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, subject_id)
);

-- Цели
CREATE TABLE tutor_goals (
    tutor_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    goal_id  VARCHAR(32) NOT NULL,
    PRIMARY KEY (tutor_id, goal_id)
);

-- Возрастные группы
CREATE TABLE tutor_age_groups (
    tutor_id     UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    age_group_id VARCHAR(32) NOT NULL,
    PRIMARY KEY (tutor_id, age_group_id)
);

-- Форматы уроков
CREATE TABLE tutor_formats (
    tutor_id  UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    format_id VARCHAR(32) NOT NULL,
    PRIMARY KEY (tutor_id, format_id)
);

-- Языки преподавания
CREATE TABLE tutor_languages (
    tutor_id      UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    language_code VARCHAR(8) NOT NULL,
    level         VARCHAR(16),
    PRIMARY KEY (tutor_id, language_code)
);

-- Образование
CREATE TABLE tutor_education (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    specialty   VARCHAR(255),
    year_start  INT,
    year_end    INT,
    sort_order  INT NOT NULL DEFAULT 0
);

-- Опыт работы
CREATE TABLE tutor_experience (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id   UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    position   VARCHAR(255) NOT NULL,
    company    VARCHAR(255),
    year_start INT,
    year_end   INT,
    sort_order INT NOT NULL DEFAULT 0
);

-- Документы
CREATE TABLE tutor_documents (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id   UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    title      VARCHAR(255),
    file_url   TEXT NOT NULL,
    file_type  VARCHAR(32),
    verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Сессии
CREATE TABLE auth_sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent    TEXT,
    ip_address    VARCHAR(64),
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_sessions_token ON auth_sessions(refresh_token);

-- Просмотры профилей
CREATE TABLE tutor_views (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id   UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id),
    ip_hash    VARCHAR(64),
    user_agent TEXT,
    referrer   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tutor_views_tutor ON tutor_views(tutor_id);
CREATE INDEX idx_tutor_views_created ON tutor_views(created_at);

-- Клики по контактам
CREATE TABLE tutor_contact_clicks (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id   UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    channel    VARCHAR(32) NOT NULL,
    user_id    UUID REFERENCES users(id),
    ip_hash    VARCHAR(64),
    referrer   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_clicks_tutor ON tutor_contact_clicks(tutor_id);
CREATE INDEX idx_contact_clicks_created ON tutor_contact_clicks(created_at);
CREATE INDEX idx_contact_clicks_channel ON tutor_contact_clicks(channel);

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
