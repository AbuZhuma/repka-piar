-- Города КР
INSERT INTO cities (slug, name_ru, name_kg, name_en, lat, lng) VALUES
    ('bishkek', 'Бишкек', 'Бишкек', 'Bishkek', 42.8746, 74.5698),
    ('osh', 'Ош', 'Ош', 'Osh', 40.5283, 72.7985),
    ('jalal-abad', 'Джалал-Абад', 'Жалал-Абад', 'Jalal-Abad', 40.9333, 73.0000),
    ('karakol', 'Каракол', 'Каракол', 'Karakol', 42.4900, 78.3936),
    ('tokmok', 'Токмок', 'Токмок', 'Tokmok', 42.8417, 75.2986),
    ('balykchy', 'Балыкчи', 'Балыкчы', 'Balykchy', 42.4631, 76.1844),
    ('cholpon-ata', 'Чолпон-Ата', 'Чолпон-Ата', 'Cholpon-Ata', 42.6500, 77.0833),
    ('naryn', 'Нарын', 'Нарын', 'Naryn', 41.4286, 75.9911),
    ('talas', 'Талас', 'Талас', 'Talas', 42.5228, 72.2422),
    ('batken', 'Баткен', 'Баткен', 'Batken', 40.0617, 70.8186);

-- Предметы
INSERT INTO subjects (slug, name_ru, name_kg, name_en, icon, category, sort_order) VALUES
    ('english',     'Английский язык',     'Англис тили',       'English',         '🇬🇧', 'languages', 1),
    ('math',        'Математика',          'Математика',        'Mathematics',     '🧮', 'sciences',  2),
    ('russian',     'Русский язык',        'Орус тили',         'Russian',         '📚', 'languages', 3),
    ('kyrgyz',      'Кыргызский язык',     'Кыргыз тили',       'Kyrgyz',          '🇰🇬', 'languages', 4),
    ('physics',     'Физика',              'Физика',            'Physics',         '⚛️', 'sciences',  5),
    ('chemistry',   'Химия',               'Химия',             'Chemistry',       '🧪', 'sciences',  6),
    ('biology',     'Биология',            'Биология',          'Biology',         '🌱', 'sciences',  7),
    ('informatics', 'Информатика',         'Информатика',       'Computer Science','💻', 'sciences',  8),
    ('history',     'История',             'Тарых',             'History',         '📜', 'humanities',9),
    ('geography',   'География',           'География',         'Geography',       '🌍', 'humanities',10),
    ('music',       'Музыка',              'Музыка',            'Music',           '🎵', 'arts',     11),
    ('art',         'Рисование',           'Сүрөт тартуу',      'Drawing',         '🎨', 'arts',     12),
    ('preschool',   'Подготовка к школе',  'Мектепке даярдоо',  'Preschool prep',  '👶', 'kids',     13);
