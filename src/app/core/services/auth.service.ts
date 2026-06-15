import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { USERS } from '../data/users';
import { User } from '../models/user.model';
import * as CryptoJS from 'crypto-js';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private router = inject(Router);

  currentUser = signal<User | null>(null);
  role = signal<'admin' | 'user' | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.restoreSession();
  }

  // =========================
  // LOGIN
  // =========================
  login(email: string, password: string) {
    return new Promise<{ success: boolean; message?: string }>((resolve) => {

      setTimeout(() => {

        const hashed = this.hash(password);

        const user = this.getAllUsers().find(
          u => u.email === email && u.password === hashed
        );

        if (!user) {
          resolve({ success: false, message: 'Invalid credentials' });
          return;
        }

        const token = btoa(JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          time: Date.now()
        }));

        sessionStorage.setItem('token', token);

        // FIX: only navigate on explicit login, not on restore
        this.setSession(user, true);

        resolve({ success: true });

      }, 400);
    });
  }

  // =========================
  // SIGNUP (NEW)
  // =========================
  signup(name: string, email: string, password: string) {

    return new Promise<{ success: boolean; message?: string }>((resolve) => {

      setTimeout(() => {

        const users = this.getAllUsers();

        const exists = users.find(u => u.email === email);

        if (exists) {
          resolve({ success: false, message: 'User already exists' });
          return;
        }

        const newUser: User = {
          id: Date.now(),
          name,
          email,
          password: this.hash(password),
          role: 'user'
        };

        const updatedUsers = [...users, newUser];

        localStorage.setItem('users', JSON.stringify(updatedUsers));

        resolve({ success: true });

      }, 400);
    });
  }

  // =========================
  // LOGOUT
  // =========================
  logout() {

    sessionStorage.removeItem('token');

    this.currentUser.set(null);
    this.role.set(null);
    this.isAuthenticated.set(false);

    this.router.navigate(['/login']);
  }

  // =========================
  // SESSION SET
  // =========================
  // FIX: navigate param defaults to false — restoreSession() (called on
  // every app bootstrap, including hard reloads of deep URLs) must NOT
  // redirect away from the URL the user actually requested. Only an
  // explicit login() action should trigger a redirect to /admin or /shop.
  private setSession(user: User, navigate: boolean = false) {

    this.currentUser.set(user);
    this.role.set(user.role);
    this.isAuthenticated.set(true);

    if (!navigate) return;

    if (user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/shop']);
    }
  }

  // =========================
  // RESTORE SESSION
  // =========================
  restoreSession() {

    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {

      const decoded = JSON.parse(atob(token));

      const user = this.getAllUsers().find(u => u.id === decoded.id);

      if (!user) {
        this.logout();
        return;
      }

      // FIX: restoring an existing session must NOT navigate —
      // let the router continue resolving whatever URL was requested
      this.setSession(user, false);

    } catch {
      this.logout();
    }
  }

  // =========================
  // ALL USERS (STATIC + SIGNED UP)
  // =========================
  private getAllUsers(): User[] {

    const localUsers = localStorage.getItem('users');

    if (localUsers) {
      return JSON.parse(localUsers);
    }

    return USERS;
  }

  // =========================
  // HASH PASSWORD
  // =========================
  private hash(value: string): string {
    return CryptoJS.SHA256(value).toString();
  }
}