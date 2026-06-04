import { env } from '@/shared/config/env';
import { auth } from '@/shared/lib/auth';

async function postFormData<T>(path: string, fd: FormData): Promise<T> {
  const resp = await fetch(`${env.apiUrl}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.getAccess() ?? ''}` },
    body: fd,
  });
  if (!resp.ok) {
    let msg = `Upload failed (${resp.status})`;
    try {
      const j = await resp.json();
      msg = j?.error?.message ?? msg;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  return (await resp.json()) as T;
}

export interface UploadedPhoto {
  url: string;
}

export function uploadMyTutorPhoto(file: File): Promise<UploadedPhoto> {
  const fd = new FormData();
  fd.append('file', file);
  return postFormData<UploadedPhoto>('/api/tutors/me/photo', fd);
}

export interface UploadedDocument {
  id: string;
  title?: string | null;
  file_url: string;
  file_type?: string | null;
  verified: boolean;
}

export function uploadMyTutorDocument(file: File, title?: string): Promise<UploadedDocument> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('title', title ?? file.name);
  return postFormData<UploadedDocument>('/api/tutors/me/documents', fd);
}
