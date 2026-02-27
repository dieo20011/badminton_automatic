import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NZ_I18N, vi_VN, NZ_DATE_LOCALE } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import vi from '@angular/common/locales/vi';
import * as fnsLocale from 'date-fns/locale';

registerLocaleData(en);
registerLocaleData(vi);
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NZ_I18N, useValue: vi_VN },
    { provide: NZ_DATE_LOCALE, useValue: fnsLocale.vi },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
  ]
};
