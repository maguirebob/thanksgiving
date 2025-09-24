import { User, Event, Photo, Session, UserRole } from '@prisma/client';

// Base types from Prisma
export type { User, Event, Photo, Session, UserRole };

// Extended types for API responses
export interface UserWithSessions extends User {
  sessions: Session[];
}

export interface EventWithPhotos extends Event {
  photos: Photo[];
}

export interface PhotoWithEvent extends Photo {
  event: Event;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
  };
  message?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// Menu/Event types for frontend
export interface MenuEvent {
  id: number;
  title: string;
  description: string;
  date: Date;
  location: string;
  menu_image_url: string;
  menu_image_filename: string;
}

export interface MenuEventWithPhotos extends MenuEvent {
  photos: Photo[];
}

// Photo upload types
export interface PhotoUploadRequest {
  event_id: number;
  description?: string;
  caption?: string;
  file: File;
}

export interface PhotoUploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

// Admin dashboard types
export interface DashboardStats {
  totalEvents: number;
  totalPhotos: number;
  totalUsers: number;
  recentEvents: EventWithPhotos[];
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: 'Validation failed';
  errors: ValidationError[];
}