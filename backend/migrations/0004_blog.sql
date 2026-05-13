-- Blog: categories, authors, posts (with block-based JSON content)

CREATE TABLE post_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(64) UNIQUE NOT NULL,
    name_ru     VARCHAR(128) NOT NULL,
    name_kg     VARCHAR(128),
    name_en     VARCHAR(128),
    description TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_authors (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    bio         TEXT,
    avatar_url  TEXT,
    role        VARCHAR(128),
    socials     JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(255) UNIQUE NOT NULL,

    title_ru        VARCHAR(255) NOT NULL,
    title_kg        VARCHAR(255),
    title_en        VARCHAR(255),

    excerpt_ru      TEXT,
    excerpt_kg      TEXT,
    excerpt_en      TEXT,

    content_ru      JSONB NOT NULL DEFAULT '[]'::JSONB,
    content_kg      JSONB,
    content_en      JSONB,

    cover_url       TEXT,

    category_id     UUID REFERENCES post_categories(id) ON DELETE SET NULL,
    author_id       UUID REFERENCES post_authors(id) ON DELETE SET NULL,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    reading_time    INT,

    status          VARCHAR(32) NOT NULL DEFAULT 'draft',
    published_at    TIMESTAMPTZ,

    views_count     INT NOT NULL DEFAULT 0,
    likes_count     INT NOT NULL DEFAULT 0,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,

    seo_title       VARCHAR(255),
    seo_description TEXT,
    seo_og_image    TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('russian', title_ru || ' ' || COALESCE(excerpt_ru, '')));
CREATE INDEX idx_posts_featured ON posts(is_featured) WHERE is_featured = TRUE;

CREATE TABLE post_related (
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    related_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    sort_order      INT NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, related_post_id)
);

CREATE TABLE post_views (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_hash     VARCHAR(64),
    referrer    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_views_post ON post_views(post_id);
CREATE INDEX idx_post_views_created ON post_views(created_at);

CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

INSERT INTO post_categories (slug, name_ru, name_kg, name_en, sort_order) VALUES
    ('exam-prep',  'Подготовка к экзаменам',     'Экзамендерге даярдануу',     'Exam preparation',         1),
    ('languages',  'Изучение языков',            'Тилдерди үйрөнүү',           'Language learning',        2),
    ('admissions', 'Поступление и образование',  'Окуу жайга кирүү',           'Admissions and education', 3),
    ('psychology', 'Психология обучения',        'Окуу психологиясы',          'Learning psychology',      4),
    ('stories',    'Истории учеников',           'Окуучулардын окуялары',      'Student stories',          5),
    ('parents',    'Для родителей',              'Ата-энелерге',               'For parents',              6);

INSERT INTO post_authors (name, role, bio) VALUES
    ('Команда Repka', 'Редакция', 'Редакция блога Repka — пишем о подготовке к экзаменам, поступлении и обучении.');

-- Sample published post so /blog has content out of the box
INSERT INTO posts (
    slug, title_ru, excerpt_ru, content_ru, cover_url,
    category_id, author_id, tags, reading_time,
    status, published_at, is_featured
) VALUES (
    'kak-podgotovitsya-k-ort',
    'Как подготовиться к ОРТ за 3 месяца',
    'Краткий гайд: с чего начать, как составить план и не сгореть до экзамена.',
    '[
      {"id":"h1","type":"heading","data":{"level":2,"text":"С чего начать"}},
      {"id":"p1","type":"paragraph","data":{"text":"Подготовка к ОРТ — это марафон, а не спринт. Самое важное — <b>правильно распределить время</b> и не пытаться выучить всё за неделю до экзамена."}},
      {"id":"c1","type":"callout","data":{"variant":"tip","title":"Совет","text":"Начните с диагностического теста — он покажет ваши слабые места."}},
      {"id":"h2","type":"heading","data":{"level":2,"text":"План на 12 недель"}},
      {"id":"l1","type":"list","data":{"style":"number","items":["Недели 1–2: диагностика и план","Недели 3–8: разбор тем","Недели 9–11: практика на типовых заданиях","Неделя 12: повторение"]}},
      {"id":"d1","type":"divider","data":{}},
      {"id":"p2","type":"paragraph","data":{"text":"Главное — регулярность. Лучше заниматься по часу каждый день, чем 8 часов в выходной."}}
    ]'::JSONB,
    NULL,
    (SELECT id FROM post_categories WHERE slug = 'exam-prep'),
    (SELECT id FROM post_authors LIMIT 1),
    ARRAY['ОРТ', 'подготовка', 'план'],
    4,
    'published',
    NOW(),
    TRUE
);
