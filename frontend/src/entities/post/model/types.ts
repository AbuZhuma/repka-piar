export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'quote'
  | 'list'
  | 'divider'
  | 'callout'
  | 'code'
  | 'gallery'
  | 'embed';

export type ImageSize = 'small' | 'medium' | 'large' | 'full' | 'wide';
export type VideoProvider = 'youtube' | 'vimeo' | 'self';
export type CalloutVariant = 'info' | 'tip' | 'warning' | 'success';

export type Block =
  | { id: string; type: 'heading'; data: { level: 2 | 3 | 4; text: string } }
  | { id: string; type: 'paragraph'; data: { text: string } }
  | {
      id: string;
      type: 'image';
      data: { url: string; alt: string; caption?: string; size?: ImageSize };
    }
  | {
      id: string;
      type: 'video';
      data: { url: string; provider: VideoProvider; caption?: string };
    }
  | { id: string; type: 'quote'; data: { text: string; author?: string } }
  | { id: string; type: 'list'; data: { style: 'bullet' | 'number'; items: string[] } }
  | { id: string; type: 'divider'; data: Record<string, never> }
  | {
      id: string;
      type: 'callout';
      data: { variant: CalloutVariant; title?: string; text: string };
    }
  | { id: string; type: 'code'; data: { language?: string; code: string } }
  | {
      id: string;
      type: 'gallery';
      data: {
        images: Array<{ url: string; alt: string }>;
        layout: 'grid' | 'carousel';
      };
    }
  | { id: string; type: 'embed'; data: { url: string; html?: string } };

export interface PostCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface PostAuthor {
  id: string;
  name: string;
  bio?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  socials?: Record<string, string>;
}

export interface PostSeo {
  title?: string | null;
  description?: string | null;
  og_image?: string | null;
}

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  category?: PostCategory | null;
  author?: PostAuthor | null;
  tags: string[];
  reading_time?: number | null;
  published_at?: string | null;
  views_count: number;
  is_featured: boolean;
}

export interface PostFull {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: Block[];
  cover_url?: string | null;
  category?: PostCategory | null;
  author?: PostAuthor | null;
  tags: string[];
  reading_time?: number | null;
  published_at?: string | null;
  views_count: number;
  seo: PostSeo;
  related: PostListItem[];
  is_translation_missing: boolean;
}

export interface PostsListResponse {
  data: PostListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PostFilters {
  category?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  locale?: string;
}
