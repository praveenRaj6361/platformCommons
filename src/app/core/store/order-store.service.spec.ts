import { TestBed } from '@angular/core/testing';

import { OrderStoreService } from './order-store.service';

describe('OrderStoreService', () => {
  let service: OrderStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
