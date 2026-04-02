export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export interface AuthResponse {
  user: User;
  isAuthenticated: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
