import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductApiService {

  // FIX: inject() instead of constructor injection
  private http = inject(HttpClient);
  private baseUrl = 'https://dummyjson.com/products';

  getProducts(
    limit: number,
    skip: number,
    search = '',
    category = ''
  ) {
    let url = this.baseUrl;
    let params = new HttpParams()
      .set('limit', limit)
      .set('skip', skip);

    if (category && category !== 'all') {
      url = `${this.baseUrl}/category/${category}`;
    }

    if (search?.trim()) {
      url = `${this.baseUrl}/search`;
      params = params.set('q', search.trim());
    }

    return this.http.get<any>(url, { params });
  }

  addProduct(product: any) {
    return this.http.post<any>(`${this.baseUrl}/add`, product);
  }

  updateProduct(id: number, product: any) {
    return this.http.put<any>(`${this.baseUrl}/${id}`, product);
  }

  deleteProduct(id: number) {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getProductById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}