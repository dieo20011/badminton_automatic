import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NZ_DATE_LOCALE } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import vi from '@angular/common/locales/vi';
import * as fnsLocale from 'date-fns/locale';
import { apiCallInterceptor } from './core/interceptor/interceptor';
import { TranslateLoader, TranslateModule, TranslationObject } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { Observable } from 'rxjs';

registerLocaleData(en);
registerLocaleData(vi);

export function initLanguage(languageService: LanguageService): () => void {
    return () => languageService.init();
}

export function createTranslateLoader(http: HttpClient): TranslateLoader {
    return {
        getTranslation: (lang: string): Observable<TranslationObject> =>
            http.get<TranslationObject>(`/assets/i18n/${lang}.json`)
    };
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NZ_DATE_LOCALE, useValue: fnsLocale.vi },
    {
      provide: APP_INITIALIZER,
      useFactory: initLanguage,
      deps: [LanguageService],
      multi: true
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiCallInterceptor]), withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      })
    )
  ]
};
