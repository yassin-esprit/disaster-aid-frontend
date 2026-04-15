import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialAuthSuccessComponent } from './social-auth-success.component';

describe('SocialAuthSuccessComponent', () => {
  let component: SocialAuthSuccessComponent;
  let fixture: ComponentFixture<SocialAuthSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialAuthSuccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialAuthSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
