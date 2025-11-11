import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterUserOrganizationComponent } from './register-user-organization.component';

describe('RegisterUserOrganizationComponent', () => {
  let component: RegisterUserOrganizationComponent;
  let fixture: ComponentFixture<RegisterUserOrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterUserOrganizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterUserOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
