// core/models/user.model.ts
export interface User {
  id: number;
  email: string;
  password: string; // hashed
  role: 'admin' | 'user';
  name: string;
}