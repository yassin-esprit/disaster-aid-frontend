import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceMapComponent } from './geofence-map.component';

describe('GeofenceMapComponent', () => {
  let component: GeofenceMapComponent;
  let fixture: ComponentFixture<GeofenceMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeofenceMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeofenceMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
