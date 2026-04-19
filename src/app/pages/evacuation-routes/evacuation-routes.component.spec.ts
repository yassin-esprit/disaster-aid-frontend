import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvacuationRoutesComponent } from './evacuation-routes.component';

describe('EvacuationRoutesComponent', () => {
  let component: EvacuationRoutesComponent;
  let fixture: ComponentFixture<EvacuationRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvacuationRoutesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvacuationRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
