import { ROUTES } from '@/shared/config/routes';

const PROFILE_SECTIONS: Record<string, string> = {
  photo: 'photo',
  video: 'video',
  bio: 'basic',
  prices: 'prices',
  contacts: 'contacts',
  education: 'education',
};

export function getEditLink(itemId: string): string {
  const section = PROFILE_SECTIONS[itemId];
  return section ? ROUTES.cabinetProfileSection(section) : ROUTES.cabinetProfile;
}
