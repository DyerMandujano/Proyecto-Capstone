import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CursoDescripcionComponent } from './curso-descripcion.component';

describe('CursoDescripcionComponent', () => {
  let component: CursoDescripcionComponent;
  let fixture: ComponentFixture<CursoDescripcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CursoDescripcionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CursoDescripcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
