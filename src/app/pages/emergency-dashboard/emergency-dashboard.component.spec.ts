import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyDashboardComponent } from './emergency-dashboard.component';

describe('EmergencyDashboardComponent', () => {
  let component: EmergencyDashboardComponent;
  let fixture: ComponentFixture<EmergencyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergencyDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
