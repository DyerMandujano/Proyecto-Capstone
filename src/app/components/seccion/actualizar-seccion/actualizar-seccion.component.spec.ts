import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarSeccionComponent } from './actualizar-seccion.component';

describe('ActualizarSeccionComponent', () => {
  let component: ActualizarSeccionComponent;
  let fixture: ComponentFixture<ActualizarSeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarSeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarSeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
