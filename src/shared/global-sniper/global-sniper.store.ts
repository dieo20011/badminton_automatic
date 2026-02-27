import { Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { ThreeCircleSpinComponent } from '../there-circle-spin/there-circle-spin.component';
@Injectable({
  providedIn: 'root',
})
export class GlobalSpinnerStore {
  private readonly $loadingCount = new BehaviorSubject<number>(0);
  $isLoading = this.$loadingCount.asObservable().pipe(map(loadingCount => loadingCount > 0));

  constructor() {}

  renderSpinner(viewContainerRef: ViewContainerRef) {
    return this.$loadingCount
      .pipe(
        tap(loading => {
          if (loading > 0) {
            if (!viewContainerRef.length) {
              viewContainerRef.createComponent(ThreeCircleSpinComponent);
            }
          } else {
            viewContainerRef.clear();
          }
        }),
        finalize(() => {
          this.stop();
        })
      )
      .subscribe();
  }

  start() {
    this.$loadingCount.next(this.$loadingCount.value + 1);
  }

  stop() {
    this.$loadingCount.next(Math.max(0, this.$loadingCount.value - 1));
  }
}