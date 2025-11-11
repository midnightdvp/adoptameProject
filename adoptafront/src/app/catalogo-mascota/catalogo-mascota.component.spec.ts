import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoMascotaComponent } from './catalogo-mascota.component';

describe('CatalogoMascotaComponent', () => {
  let component: CatalogoMascotaComponent;
  let fixture: ComponentFixture<CatalogoMascotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoMascotaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CatalogoMascotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
