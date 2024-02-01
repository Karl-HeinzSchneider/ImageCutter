import { TestBed } from '@angular/core/testing';

import { KeypressService } from './keypress.service';

describe('KeypressService', () => {
  let service: KeypressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeypressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
