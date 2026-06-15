import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductStoreService } from '../../../core/store/product-store.service';
import { ProductApiService } from '../../../core/services/product-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {

  // =========================
  // SERVICES (inject only)
  // =========================
  store = inject(ProductStoreService);
  api = inject(ProductApiService);
  destroyRef = inject(DestroyRef);

  // =========================
  // STREAMS
  // =========================
  searchInput = new Subject<string>();
  categoryInput = new Subject<string>();

  // =========================
  // SORT STATE
  // =========================
  sortField = signal<'title' | 'category' | 'price' | 'stock' | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  // =========================
  // UI STATE
  // =========================
  isFormOpen = signal(false);
  isEditMode = signal(false);
  isDeleteModalOpen = signal(false);
  selectedProductId = signal<number | null>(null);

  formProduct = signal<any>({
    id: null,
    title: '',
    category: '',
    price: 0,
    stock: 0
  });

  // =========================
  // INIT (replaces constructor)
  // =========================
  ngOnInit(): void {

    this.store.loadProducts(true);

    // FIX: added switchMap per Task 2 spec (debounceTime + switchMap)
    this.searchInput.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(value => {
        this.store.setSearch(value.trim());
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    this.categoryInput.pipe(
      switchMap(value => {
        this.store.setCategory(value);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // =========================
  // SORT
  // =========================
  sort(field: 'title' | 'category' | 'price' | 'stock') {

    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }

    this.store.setPage(1);
  }

  // =========================
  // SORTED PRODUCTS
  // =========================
  readonly sortedProducts = computed(() => {

    const field = this.sortField();
    const dir = this.sortDirection();

    let products = [...this.store.products()].sort((a: any, b: any) => {
      return b.id - a.id;
    });

    if (field) {
      products = [...products].sort((a: any, b: any) => {

        let valA: any;
        let valB: any;

        if (field === 'title') {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        } else if (field === 'category') {
          valA = a.category.toLowerCase();
          valB = b.category.toLowerCase();
        } else if (field === 'price') {
          valA = a.price;
          valB = b.price;
        } else {
          valA = a.stock;
          valB = b.stock;
        }

        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return products;
  });

  // =========================
  // SEARCH / CATEGORY
  // =========================
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.next(value);
  }

  onCategory(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.categoryInput.next(value);
  }

  // =========================
  // PAGINATION
  // =========================
  // FIX: skip/limit are now signals — call them as functions
  nextPage() {
    this.store.setPage(this.currentPage + 1);
  }

  prevPage() {
    const current = this.currentPage;
    if (current > 1) {
      this.store.setPage(current - 1);
    }
  }

  get currentPage(): number {
    return Math.floor(this.store.skip() / this.store.limit()) + 1;
  }

  // =========================
  // SORT ICON
  // =========================
  getSortIcon(field: string): string {
    if (this.sortField() !== field) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  // =========================
  // FORM ACTIONS
  // =========================
  openAddForm() {
    this.isEditMode.set(false);
    this.formProduct.set({
      id: null,
      title: '',
      category: '',
      price: 0,
      stock: 0
    });
    this.isFormOpen.set(true);
  }

  openEditForm(product: any) {
    this.isEditMode.set(true);
    this.formProduct.set({ ...product });
    this.isFormOpen.set(true);
  }

  updateField(field: string, value: any) {
    this.formProduct.update(current => ({
      ...current,
      [field]: value
    }));
  }

  // =========================
  // DELETE
  // =========================
  openDeleteModal(id: number) {
    this.selectedProductId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const id = this.selectedProductId();
    if (id !== null) this.store.deleteProduct(id);
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.selectedProductId.set(null);
    this.isDeleteModalOpen.set(false);
  }

  // =========================
  // SAVE
  // =========================
  saveProduct() {

    const product = this.formProduct();

    if (this.isEditMode()) {
      this.store.updateProduct({ ...product });
      this.closeForm();
      return;
    }

    this.api.addProduct(product).subscribe({
      next: (newProduct) => {

        const productToAdd = {
          ...product,
          id: newProduct?.id ?? Date.now()
        };

        this.store.addProduct(productToAdd);
        this.closeForm();
      }
    });
  }

  closeForm() {
    this.isFormOpen.set(false);
  }
}