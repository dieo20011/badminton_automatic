import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalSniperComponent } from './global-sniper.component';

describe('GlobalSniperComponent', () => {
  let component: GlobalSniperComponent;
  let fixture: ComponentFixture<GlobalSniperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSniperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSniperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
