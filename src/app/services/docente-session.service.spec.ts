import { TestBed } from '@angular/core/testing';

import { DocenteSessionService } from './docente-session.service';

describe('DocenteSessionService', () => {
  let service: DocenteSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocenteSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
