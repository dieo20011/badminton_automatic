import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzI18nService, en_US, vi_VN } from 'ng-zorro-antd/i18n';

export type LanguageCode = 'en' | 'vn';

const LANGUAGE_STORAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE: LanguageCode = 'vn';
const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'vn'];

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private currentLanguage: LanguageCode = DEFAULT_LANGUAGE;

    constructor(
        private readonly translate: TranslateService,
        private readonly nzI18nService: NzI18nService
    ) {}

    init(): void {
        this.translate.setDefaultLang(DEFAULT_LANGUAGE);
        const persisted = this.readStoredLanguage();
        this.applyLanguage(persisted);
    }

    setLanguage(language: LanguageCode): void {
        this.applyLanguage(language);
    }

    getCurrentLanguage(): LanguageCode {
        return this.currentLanguage;
    }

    getCurrentLocaleCode(): 'vi-VN' | 'en-US' {
        return this.currentLanguage === 'vn' ? 'vi-VN' : 'en-US';
    }

    getSupportedLanguages(): LanguageCode[] {
        return [...SUPPORTED_LANGUAGES];
    }

    private readStoredLanguage(): LanguageCode {
        const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (raw === 'en' || raw === 'vn') return raw;
        return DEFAULT_LANGUAGE;
    }

    private applyLanguage(language: LanguageCode): void {
        this.currentLanguage = language;
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        this.translate.use(language);
        this.nzI18nService.setLocale(language === 'vn' ? vi_VN : en_US);
        document.documentElement.lang = language === 'vn' ? 'vi' : 'en';
    }
}
