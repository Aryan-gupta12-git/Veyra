export type UserRole = 'USER' | 'ADMIN';

export interface Topic {
  id: string;
  name: string;
  slug: string;
}

export interface UserInterest {
  userId: string;
  topicId: string;
  topic?: Topic;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboardingCompleted: boolean;
  interests?: UserInterest[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}
