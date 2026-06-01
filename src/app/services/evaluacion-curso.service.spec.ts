import { TestBed } from '@angular/core/testing';

import { EvaluacionCursoService } from './evaluacion-curso.service';

describe('EvaluacionCursoService', () => {
  let service: EvaluacionCursoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvaluacionCursoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
