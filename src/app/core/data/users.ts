// core/data/users.ts
import { User } from '../models/user.model';

export const USERS: User[] = [
  {
    id: 1,
    name: 'Admin One',
    email: 'admin1@test.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // password
    role: 'admin'
  },
  {
    id: 2,
    name: 'Admin Two',
    email: 'admin2@test.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    role: 'admin'
  },
  {
    id: 3,
    name: 'User One',
    email: 'user1@test.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    role: 'user'
  },
  {
    id: 4,
    name: 'User Two',
    email: 'user2@test.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    role: 'user'
  }
];