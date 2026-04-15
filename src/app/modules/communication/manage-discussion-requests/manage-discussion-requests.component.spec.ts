import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageDiscussionRequestsComponent } from './manage-discussion-requests.component';

describe('ManageDiscussionRequestsComponent', () => {
  let component: ManageDiscussionRequestsComponent;
  let fixture: ComponentFixture<ManageDiscussionRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageDiscussionRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageDiscussionRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
