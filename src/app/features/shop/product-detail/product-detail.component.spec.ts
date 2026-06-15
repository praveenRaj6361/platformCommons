import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                product: {
                  id: 1,
                  title: 'Test Product',
                  price: 99.99,
                  stock: 10,
                  category: 'smartphones',
                  thumbnail: ''
                }
              },
              paramMap: { get: () => '1' },
              queryParamMap: { get: () => null }
            },
            paramMap: of({ get: () => '1' }),
            queryParamMap: of({ get: () => null }),
            data: of({ product: { id: 1, title: 'Test Product', price: 99.99, stock: 10, category: 'smartphones', thumbnail: '' } })
          }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});