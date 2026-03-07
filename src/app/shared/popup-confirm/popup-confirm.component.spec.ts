import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpConfirmComponent } from './popup-confirm.component';

describe('PopupConfirmComponent', () => {
  let component: PopUpConfirmComponent;
  let fixture: ComponentFixture<PopUpConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopUpConfirmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopUpConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
