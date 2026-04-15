import { TestBed } from '@angular/core/testing';

import { DiscussionRequestService } from './discussion-request.service';

describe('DiscussionRequestService', () => {
  let service: DiscussionRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiscussionRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
