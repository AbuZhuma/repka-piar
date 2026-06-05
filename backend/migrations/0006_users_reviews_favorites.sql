-- Public users (students/parents):
--   * avatar uploaded by the user directly (was only available via tutor_profile photo before)
--   * email verification flow
-- Plus user-owned favorites (synced from guest localStorage on first login) and
-- tutor reviews with star ratings.

-- ----------------------------------------------------------- 1. user avatar
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ---------------------------------------------- 2. email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token       VARCHAR(96) PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_verif_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_expires ON email_verification_tokens(expires_at);

-- --------------------------------------------------------- 3. user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_tutor ON user_favorites(tutor_id);

-- --------------------------------------------------------- 4. tutor_reviews
CREATE TABLE IF NOT EXISTS tutor_reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text        TEXT,
    is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tutor_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tutor_reviews_tutor ON tutor_reviews(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_user ON tutor_reviews(user_id);

CREATE TRIGGER set_tutor_reviews_updated_at BEFORE UPDATE ON tutor_reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- --------------------- 5. keep tutor_profiles.rating / reviews_count in sync
-- Recomputes the cached aggregate on every insert/update/delete.

CREATE OR REPLACE FUNCTION recompute_tutor_rating(_tutor_id UUID) RETURNS VOID
    LANGUAGE plpgsql AS $$
BEGIN
    UPDATE tutor_profiles tp SET
        rating = sub.avg_rating,
        reviews_count = sub.cnt
    FROM (
        SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0)::NUMERIC AS avg_rating,
               COUNT(*)::INT AS cnt
        FROM tutor_reviews
        WHERE tutor_id = _tutor_id AND is_hidden = FALSE
    ) sub
    WHERE tp.id = _tutor_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_tutor_reviews_recompute() RETURNS TRIGGER
    LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recompute_tutor_rating(OLD.tutor_id);
        RETURN OLD;
    ELSE
        PERFORM recompute_tutor_rating(NEW.tutor_id);
        IF TG_OP = 'UPDATE' AND OLD.tutor_id <> NEW.tutor_id THEN
            PERFORM recompute_tutor_rating(OLD.tutor_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_tutor_reviews_recompute_iu
    AFTER INSERT OR UPDATE ON tutor_reviews
    FOR EACH ROW EXECUTE FUNCTION trg_tutor_reviews_recompute();

CREATE TRIGGER trg_tutor_reviews_recompute_del
    AFTER DELETE ON tutor_reviews
    FOR EACH ROW EXECUTE FUNCTION trg_tutor_reviews_recompute();
