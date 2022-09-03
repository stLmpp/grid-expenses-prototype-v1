import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPersonComponent } from './header-person.component';

describe('HeaderPersonComponent', () => {
  let component: HeaderPersonComponent;
  let fixture: ComponentFixture<HeaderPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderPersonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
