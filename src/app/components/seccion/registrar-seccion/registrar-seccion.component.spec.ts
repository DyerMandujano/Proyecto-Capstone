import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarSeccionComponent } from './registrar-seccion.component';

describe('RegistrarSeccionComponent', () => {
  let component: RegistrarSeccionComponent;
  let fixture: ComponentFixture<RegistrarSeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarSeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarSeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
