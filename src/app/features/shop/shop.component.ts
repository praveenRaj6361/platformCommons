import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Shell component for the /shop module.
 * Uses @defer so the shop content is deferred from the initial load.
 */
@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @defer (on immediate) {
      <router-outlet />
    } @placeholder {
      <div class="shop-placeholder">
        <div class="skel-bar"></div>
        <div class="skel-bar short"></div>
        <div class="skel-bar shorter"></div>
      </div>
    }
  `,
  styles: [`
    .shop-placeholder {
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skel-bar {
      height: 22px;
      width: 100%;
      border-radius: 8px;
      background: linear-gradient(
        90deg,
        #f3f4f6 25%,
        #e5e7eb 50%,
        #f3f4f6 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    .skel-bar.short {
      width: 65%;
    }

    .skel-bar.shorter {
      width: 40%;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }

      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class ShopComponent {}