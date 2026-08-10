import { User, Topic } from './user';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  topicId?: string | null;
  topic?: Topic | null;
  tags?: string[];
  readingTime?: number;
  views?: number;
  likes?: number;
  hasLiked?: boolean;
  authorName?: string | null;
  published: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  topicId?: string;
  tags?: string[];
  authorName?: string;
  published?: boolean;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {}
