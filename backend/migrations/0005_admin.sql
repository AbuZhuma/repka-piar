-- Admin: moderation history, audit log, site settings, feedback, seed admin user

CREATE TABLE tutor_moderation_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    admin_id    UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(64) NOT NULL,
    reason      TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_history_tutor ON tutor_moderation_history(tutor_id);
CREATE INDEX idx_moderation_history_admin ON tutor_moderation_history(admin_id);

CREATE TABLE admin_audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id    UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(128) NOT NULL,
    target_type VARCHAR(64),
    target_id   UUID,
    details     JSONB,
    ip          VARCHAR(64),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);

CREATE TABLE site_settings (
    key         VARCHAR(128) PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
    ('site.name',        '"Repka"'::JSONB),
    ('site.description', '"Маркетплейс репетиторов в Кыргызстане"'::JSONB),
    ('site.support_email', '"support@repka.kg"'::JSONB),
    ('site.support_phone', '"+996 555 000 000"'::JSONB),
    ('site.socials',     '{"telegram":"https://t.me/repka_kg","instagram":""}'::JSONB),
    ('seo.default_title_template', '"%s | Repka"'::JSONB),
    ('seo.default_description', '"Найдите репетитора в Кыргызстане без комиссий и посредников."'::JSONB),
    ('integrations.ga_id', '""'::JSONB),
    ('integrations.ym_id', '""'::JSONB);

CREATE TABLE feedback_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255),
    email       VARCHAR(255),
    phone       VARCHAR(64),
    topic       VARCHAR(64),
    message     TEXT NOT NULL,
    status      VARCHAR(32) NOT NULL DEFAULT 'new',
    notes       TEXT,
    handled_by  UUID REFERENCES users(id),
    handled_at  TIMESTAMPTZ,
    ip          VARCHAR(64),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_status ON feedback_messages(status);
CREATE INDEX idx_feedback_created ON feedback_messages(created_at DESC);

CREATE TRIGGER set_feedback_updated_at BEFORE UPDATE ON feedback_messages
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE admin_media (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID REFERENCES users(id),
    url         TEXT NOT NULL,
    filename    VARCHAR(255),
    mime_type   VARCHAR(64),
    size_bytes  BIGINT,
    width       INT,
    height      INT,
    alt_text    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_media_uploaded ON admin_media(uploaded_by);
CREATE INDEX idx_admin_media_created ON admin_media(created_at DESC);

-- Seed admin role for any existing seed user is done at runtime in main.rs (ensure_admin).
