export interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
