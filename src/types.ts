/**
 * Role & Article Status Types for Electronic Journal (Scientific Magazine) CMS
 */

export type UserRole = 'admin' | 'reviewer' | 'author';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Optional so we don't send to client
  created_at?: string;
}

export type ArticleStatus = 'Pending' | 'Under Review' | 'Needs Revision' | 'Approved' | 'Rejected';

export interface Article {
  id: number;
  user_id: number;
  author_name?: string; // Hydrated on retrieval
  title: string;
  abstract: string;
  keywords: string;
  file_path: string; // PDF link or simulated file link
  status: ArticleStatus;
  authors_list?: string; // Co-authors text/list
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'Pending' | 'Approve' | 'Reject' | 'Request Revision';

export interface ArticleAssignment {
  id: number;
  article_id: number;
  reviewer_id: number;
  reviewer_name?: string; // Hydrated
  review_comment: string | null;
  status: AssignmentStatus;
  assigned_at: string;
  reviewed_at?: string | null;
}

// Full hydrated article detail for Admin / Reviewer
export interface ArticleDetail extends Article {
  assignments: ArticleAssignment[];
}

export interface PublishedArticle {
  id: number;
  title: string;
  abstract: string;
  authors: string;
  keywords: string;
  file_path: string;
  publishDate: string;
  isDynamic: boolean;
}

export interface PublishedIssue {
  id: number;
  title: string;
  specialName: string;
  publishDate: string;
  editorInChief: string;
  coverColor: string;
  articles: PublishedArticle[];
}

