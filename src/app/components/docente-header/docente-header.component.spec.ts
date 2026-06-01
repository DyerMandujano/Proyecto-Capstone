import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocenteHeaderComponent } from './docente-header.component';

describe('DocenteHeaderComponent', () => {
  let component: DocenteHeaderComponent;
  let fixture: ComponentFixture<DocenteHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocenteHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocenteHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
