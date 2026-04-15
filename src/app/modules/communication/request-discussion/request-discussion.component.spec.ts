import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestDiscussionComponent } from './request-discussion.component';

describe('RequestDiscussionComponent', () => {
  let component: RequestDiscussionComponent;
  let fixture: ComponentFixture<RequestDiscussionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestDiscussionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestDiscussionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
