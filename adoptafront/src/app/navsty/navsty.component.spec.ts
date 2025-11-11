import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavstyComponent } from './navsty.component';

describe('NavstyComponent', () => {
  let component: NavstyComponent;
  let fixture: ComponentFixture<NavstyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavstyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NavstyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
