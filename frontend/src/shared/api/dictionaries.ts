import { apiGet } from '@/shared/lib/api';
import type { City, Subject } from '@/shared/types';

export interface DictionariesPayload {
  cities: City[];
  subjects: Subject[];
}

export async function getDictionaries(): Promise<DictionariesPayload> {
  return apiGet<DictionariesPayload>('/api/dictionaries/all');
}
