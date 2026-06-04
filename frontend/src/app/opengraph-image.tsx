import { ImageResponse } from 'next/og';

export const alt = 'Repka — маркетплейс репетиторов в Кыргызстане';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 96px',
          background:
            'linear-gradient(135deg, #fff7f3 0%, #ffe9dc 50%, #ffd2b8 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="80" height="80" viewBox="0 0 32 32">
            <path d="M11 4 C11 2 14 2 14 4 L14 7 C14 8 13 8 13 8 L11 8 C10 8 10 7 10 7 Z" fill="#16a34a" />
            <path d="M16 4 C16 2 19 2 19 4 L19 7 C19 8 18 8 18 8 L16 8 C15 8 15 7 15 7 Z" fill="#16a34a" />
            <path d="M21 4 C21 2 24 2 24 4 L24 7 C24 8 23 8 23 8 L21 8 C20 8 20 7 20 7 Z" fill="#16a34a" />
            <path d="M16 7 C9 7 5 13 5 19 C5 25 10 30 16 30 C22 30 27 25 27 19 C27 13 23 7 16 7 Z" fill="#fb6a3c" />
            <ellipse cx="12" cy="16" rx="2" ry="3" fill="#fff" opacity="0.45" />
          </svg>
          <span style={{ fontSize: 56, fontWeight: 800, color: '#1f2937' }}>Repka</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 72, fontWeight: 800, color: '#1f2937', lineHeight: 1.05 }}>
            Найдите репетитора
            <br />
            в Кыргызстане
          </h1>
          <p style={{ margin: 0, fontSize: 32, color: '#4b5563', maxWidth: 900 }}>
            500+ проверенных педагогов · ОРТ · IELTS · школа · онлайн и офлайн
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              padding: '12px 24px',
              borderRadius: 999,
              background: '#fb6a3c',
              color: 'white',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            0% комиссии с уроков
          </span>
          <span style={{ fontSize: 24, color: '#6b7280' }}>repka.kg</span>
        </div>
      </div>
    ),
    size,
  );
}
