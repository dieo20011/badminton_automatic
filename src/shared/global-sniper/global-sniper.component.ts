import { Component, OnInit, ViewContainerRef, inject } from '@angular/core';
import { GlobalSpinnerStore } from './global-sniper.store';

@Component({
  selector: 'app-global-sniper',
  imports: [],
  template: '',
})
export class GlobalSniperComponent implements OnInit {
  private readonly globalSpinnerStore = inject(GlobalSpinnerStore);
  private readonly viewContainerRef = inject(ViewContainerRef);

  ngOnInit(): void {
    this.globalSpinnerStore.renderSpinner(this.viewContainerRef);
  }
}
