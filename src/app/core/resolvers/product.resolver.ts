import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductApiService } from '../services/product-api.service';

export const productResolver: ResolveFn<any> = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(ProductApiService).getProductById(id);
};