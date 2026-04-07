import { TestBed } from '@angular/core/testing';

import { NotificationPreferenceService } from './notification-preference.service';

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPreferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
