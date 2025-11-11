import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPetComponent } from './admin-pet.component';

describe('AdminPetComponent', () => {
  let component: AdminPetComponent;
  let fixture: ComponentFixture<AdminPetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminPetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
