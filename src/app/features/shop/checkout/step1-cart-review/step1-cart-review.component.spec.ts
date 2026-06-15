import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1CartReviewComponent } from './step1-cart-review.component';

describe('Step1CartReviewComponent', () => {
  let component: Step1CartReviewComponent;
  let fixture: ComponentFixture<Step1CartReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step1CartReviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Step1CartReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
