export interface LoginFormValues {
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
  };
} 