import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontofficeProfileComponent } from './frontoffice-profile.component';

describe('FrontofficeProfileComponent', () => {
  let component: FrontofficeProfileComponent;
  let fixture: ComponentFixture<FrontofficeProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontofficeProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontofficeProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
