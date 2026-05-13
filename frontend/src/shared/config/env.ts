const fallback = 'http://localhost:8080';
const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? fallback;

export const env = {
  apiUrl: publicUrl,
  internalApiUrl: process.env.INTERNAL_API_URL ?? publicUrl,
};
