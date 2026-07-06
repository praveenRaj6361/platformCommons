import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  readonly toasts = signal<Toast[]>([]);

  private nextId = 0;

  show(message: string, type: Toast['type'] = 'error', duration = 3000): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, message, type }]);

    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}