interface CatalogFilters {
  subject?: string;
  goal?: string;
  q?: string;
  city?: string;
}

function buildCatalog(filters: CatalogFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.subject) params.set('subject', filters.subject);
  if (filters.goal) params.set('goal', filters.goal);
  if (filters.q) params.set('q', filters.q);
  if (filters.city) params.set('city', filters.city);
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : '/catalog';
}

export const ROUTES = {
  home: '/',
  catalog: '/catalog',
  catalogBy: buildCatalog,
  tutor: (slug: string) => `/tutor/${slug}`,
  forStudents: '/for-students',
  forTutors: '/for-tutors',
  support: '/support',
  favorites: '/favorites',
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  blogByCategory: (categorySlug: string) => `/blog?category=${encodeURIComponent(categorySlug)}`,
  about: '/about',
  contacts: '/contacts',
  becomeTutor: '/become-tutor',
  becomeTutorRegister: '/become-tutor/register',
  becomeTutorSuccess: '/become-tutor/success',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  cabinet: '/cabinet',
  cabinetProfile: '/cabinet/profile',
  cabinetProfileSection: (id: string) => `/cabinet/profile#${id}`,
  cabinetAnalytics: '/cabinet/analytics',
  cabinerSettings: '/cabinet/settings',
  cabinetSuport: '/cabinet/support',
  admin: {
    root: '/admin',
    login: '/admin/login',
    tutors: '/admin/tutors',
    tutor: (id: string) => `/admin/tutors/${id}`,
    tutorsPending: '/admin/tutors?status=pending',
    posts: '/admin/posts',
    postNew: '/admin/posts/new',
    postEdit: (id: string) => `/admin/posts/${id}/edit`,
    postsDrafts: '/admin/posts?status=draft',
    categories: '/admin/categories',
    authors: '/admin/authors',
    feedback: '/admin/feedback',
    feedbackItem: (id: string) => `/admin/feedback/${id}`,
    feedbackNew: '/admin/feedback?status=new',
    users: '/admin/users',
    settings: '/admin/settings',
    cities: '/admin/dictionaries/cities',
    subjects: '/admin/dictionaries/subjects',
    analytics: '/admin/analytics',
  },
  legal: {
    offer: '/legal/tutor-offer',
    privacy: '/legal/privacy',
    cookie: '/legal/cookies',
    rules: '/legal/rules',
  },
} as const;
