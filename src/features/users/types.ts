export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tipe_user?: string;
  status: string;
  provinsi_id?: number;
  provinsi_nama?: string;
  kabupaten_id?: number;
  kabupaten_nama?: string;
  last_login_at?: string;
  created_at: string;
}

export interface AdminUserCounts {
  total: number;
  super: number;
  nasional: number;
  provinsi: number;
  kabupaten: number;
}

export interface UserCreateInput {
  name: string;
  email: string;
  role: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  status?: string;
}

export interface UserUpdateInput extends UserCreateInput {
  reset_password?: boolean;
  password?: string;
}

export interface UserMutationResult {
  user: AdminUser;
  password?: string;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}
