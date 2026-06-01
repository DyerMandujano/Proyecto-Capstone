import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizarCursosComponent } from './visualizar-cursos.component';

describe('VisualizarCursosComponent', () => {
  let component: VisualizarCursosComponent;
  let fixture: ComponentFixture<VisualizarCursosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizarCursosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualizarCursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
