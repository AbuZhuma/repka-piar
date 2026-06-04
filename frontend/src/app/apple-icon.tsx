import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff7f3',
        }}
      >
        <svg width="160" height="160" viewBox="0 0 32 32">
          <path
            d="M11 4 C11 2 14 2 14 4 L14 7 C14 8 13 8 13 8 L11 8 C10 8 10 7 10 7 Z"
            fill="#16a34a"
          />
          <path
            d="M16 4 C16 2 19 2 19 4 L19 7 C19 8 18 8 18 8 L16 8 C15 8 15 7 15 7 Z"
            fill="#16a34a"
          />
          <path
            d="M21 4 C21 2 24 2 24 4 L24 7 C24 8 23 8 23 8 L21 8 C20 8 20 7 20 7 Z"
            fill="#16a34a"
          />
          <path
            d="M16 7 C9 7 5 13 5 19 C5 25 10 30 16 30 C22 30 27 25 27 19 C27 13 23 7 16 7 Z"
            fill="#fb6a3c"
          />
          <ellipse cx="12" cy="16" rx="2" ry="3" fill="#fff" opacity="0.45" />
        </svg>
      </div>
    ),
    size,
  );
}
