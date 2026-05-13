'use client';

import { useEffect, useState } from 'react';

import { adminListSettings, adminUpdateSetting, type SiteSetting } from '@/shared/api/admin';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

import styles from './page.module.scss';

interface SettingMeta {
  label: string;
  hint?: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'json';
  placeholder?: string;
}

const META: Record<string, SettingMeta> = {
  'site.name': { label: 'Название сайта', type: 'text', placeholder: 'Repka' },
  'site.description': {
    label: 'Описание сайта',
    type: 'textarea',
    placeholder: 'Маркетплейс репетиторов в Кыргызстане',
  },
  'site.support_email': {
    label: 'Email поддержки',
    type: 'email',
    placeholder: 'support@repka.kg',
  },
  'site.support_phone': {
    label: 'Телефон поддержки',
    type: 'text',
    placeholder: '+996 555 000 000',
  },
  'site.socials': {
    label: 'Соцсети',
    type: 'json',
    hint: 'JSON-объект: telegram, instagram, facebook, …',
  },
  'seo.default_title_template': {
    label: 'SEO: шаблон title',
    type: 'text',
    placeholder: '%s | Repka',
    hint: '%s заменится на title страницы',
  },
  'seo.default_description': {
    label: 'SEO: описание по умолчанию',
    type: 'textarea',
    placeholder: 'Найдите репетитора в Кыргызстане без комиссий и посредников.',
  },
  'integrations.ga_id': {
    label: 'Google Analytics 4',
    type: 'text',
    placeholder: 'G-XXXXXXX',
    hint: 'Measurement ID',
  },
  'integrations.ym_id': {
    label: 'Яндекс.Метрика',
    type: 'text',
    placeholder: '00000000',
    hint: 'Counter ID',
  },
};

const SECTIONS: Array<{ title: string; prefix: string }> = [
  { title: 'Основные', prefix: 'site.' },
  { title: 'SEO', prefix: 'seo.' },
  { title: 'Интеграции', prefix: 'integrations.' },
];

function asString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  return JSON.stringify(v, null, 2);
}

export default function SettingsPage() {
  const [items, setItems] = useState<SiteSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ key: string; text: string; tone: 'ok' | 'err' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListSettings()
      .then((list) => {
        setItems(list);
        const next: Record<string, string> = {};
        list.forEach((s) => {
          next[s.key] = asString(s.value);
        });
        setDrafts(next);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSave = async (key: string) => {
    setSavingKey(key);
    setMsg(null);
    const meta = META[key] ?? { type: 'text' as const, label: key };
    const raw = drafts[key] ?? '';
    let value: unknown;
    if (meta.type === 'json') {
      try {
        value = raw.trim() ? JSON.parse(raw) : {};
      } catch {
        setMsg({ key, text: 'Невалидный JSON', tone: 'err' });
        setSavingKey(null);
        return;
      }
    } else {
      value = raw;
    }
    try {
      const updated = await adminUpdateSetting(key, value);
      setItems((arr) => arr.map((s) => (s.key === key ? updated : s)));
      setMsg({ key, text: 'Сохранено', tone: 'ok' });
    } catch (e: unknown) {
      setMsg({
        key,
        text: e instanceof Error ? e.message : 'Не удалось сохранить',
        tone: 'err',
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Загрузка...</p>;
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки сайта</h1>
        <p className={styles.subtitle}>
          Параметры площадки. Секреты (API-ключи интеграций) безопаснее держать в env.
        </p>
      </header>

      {SECTIONS.map((section) => {
        const sectionItems = items.filter((s) => s.key.startsWith(section.prefix));
        if (sectionItems.length === 0) return null;
        return (
          <section key={section.prefix} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.grid}>
              {sectionItems.map((s) => {
                const meta = META[s.key] ?? { type: 'text' as const, label: s.key };
                const value = drafts[s.key] ?? '';
                const original = asString(s.value);
                const dirty = value !== original;
                const showMsg = msg?.key === s.key;
                return (
                  <div key={s.key} className={styles.field}>
                    <div className={styles.fieldHead}>
                      <strong className={styles.fieldLabel}>{meta.label}</strong>
                      <code className={styles.fieldKey}>{s.key}</code>
                    </div>

                    {meta.type === 'textarea' || meta.type === 'json' ? (
                      <Textarea
                        value={value}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
                        }
                        placeholder={meta.placeholder}
                        rows={meta.type === 'json' ? 4 : 3}
                        className={meta.type === 'json' ? styles.mono : undefined}
                      />
                    ) : (
                      <Input
                        type={meta.type}
                        value={value}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
                        }
                        placeholder={meta.placeholder}
                      />
                    )}

                    <div className={styles.fieldFoot}>
                      {meta.hint && <span className={styles.hint}>{meta.hint}</span>}
                      {showMsg && (
                        <span className={msg?.tone === 'err' ? styles.msgErr : styles.msgOk}>
                          {msg!.text}
                        </span>
                      )}
                      {dirty && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onSave(s.key)}
                          loading={savingKey === s.key}
                        >
                          Сохранить
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
