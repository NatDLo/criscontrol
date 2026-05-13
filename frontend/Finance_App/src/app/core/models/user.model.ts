export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  date_joined: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface UpdateProfileDto {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
  new_password2: string;
}