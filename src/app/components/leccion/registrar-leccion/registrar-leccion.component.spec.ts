import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarLeccionComponent } from './registrar-leccion.component';

describe('RegistrarLeccionComponent', () => {
  let component: RegistrarLeccionComponent;
  let fixture: ComponentFixture<RegistrarLeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarLeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarLeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
