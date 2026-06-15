import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Step2DeliveryComponent } from './step2-delivery.component';

describe('Step2DeliveryComponent', () => {
  let component: Step2DeliveryComponent;
  let fixture: ComponentFixture<Step2DeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2DeliveryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Step2DeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});