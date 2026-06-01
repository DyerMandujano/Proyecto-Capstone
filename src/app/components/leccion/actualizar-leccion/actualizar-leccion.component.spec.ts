import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarLeccionComponent } from './actualizar-leccion.component';

describe('ActualizarLeccionComponent', () => {
  let component: ActualizarLeccionComponent;
  let fixture: ComponentFixture<ActualizarLeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarLeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarLeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
