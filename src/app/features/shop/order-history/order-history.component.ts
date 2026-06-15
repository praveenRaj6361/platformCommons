import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderStoreService } from '../../../core/store/order-store.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {

  private orderStore = inject(OrderStoreService);
  private auth       = inject(AuthService);

  readonly loading = this.orderStore.loading;

  readonly orders = computed(() => {
    const userName = this.auth.currentUser()?.name?.toLowerCase() ?? '';
    return this.orderStore.orders().filter(o =>
      !userName || o.customerName.toLowerCase().includes(userName)
    );
  });

  readonly skeletons = Array(3).fill(0);

  ngOnInit(): void {
    this.orderStore.loadOrders();
  }

  trackById(_: number, o: any): string {
    return o.id;
  }
}