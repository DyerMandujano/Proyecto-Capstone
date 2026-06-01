import { TestBed } from '@angular/core/testing';

import { CertificadoCursoService } from './certificado-curso.service';

describe('CertificadoCursoService', () => {
  let service: CertificadoCursoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CertificadoCursoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
