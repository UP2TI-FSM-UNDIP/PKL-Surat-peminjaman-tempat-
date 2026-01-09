// src/types.ts
export type UserRole = 'admin' | 'mahasiswa' | 'dosen';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole; // <--- Wajib ada ini
}
