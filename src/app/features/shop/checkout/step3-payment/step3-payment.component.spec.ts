import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Step3PaymentComponent } from './step3-payment.component';

describe('Step3PaymentComponent', () => {
  let component: Step3PaymentComponent;
  let fixture: ComponentFixture<Step3PaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step3PaymentComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null } },
            paramMap: of({ get: () => null }),
            queryParamMap: of({ get: () => null }),
          }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Step3PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});