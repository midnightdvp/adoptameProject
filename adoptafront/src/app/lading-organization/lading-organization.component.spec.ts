import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadingOrganizationComponent } from './lading-organization.component';

describe('LadingOrganizationComponent', () => {
  let component: LadingOrganizationComponent;
  let fixture: ComponentFixture<LadingOrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LadingOrganizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LadingOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
