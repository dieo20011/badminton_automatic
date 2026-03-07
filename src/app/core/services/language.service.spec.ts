import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NzI18nService, en_US, vi_VN } from 'ng-zorro-antd/i18n';
import { LanguageCode, LanguageService } from './language.service';

describe('LanguageService', () => {
    let service: LanguageService;
    let translate: jasmine.SpyObj<TranslateService>;
    let nzI18n: jasmine.SpyObj<NzI18nService>;

    beforeEach(() => {
        localStorage.clear();
        translate = jasmine.createSpyObj<TranslateService>('TranslateService', ['setDefaultLang', 'use']);
        nzI18n = jasmine.createSpyObj<NzI18nService>('NzI18nService', ['setLocale']);

        TestBed.configureTestingModule({
            providers: [
                LanguageService,
                { provide: TranslateService, useValue: translate },
                { provide: NzI18nService, useValue: nzI18n }
            ]
        });

        service = TestBed.inject(LanguageService);
    });

    it('defaults to vn when storage is empty', () => {
        service.init();

        expect(translate.setDefaultLang).toHaveBeenCalledWith('vn');
        expect(translate.use).toHaveBeenCalledWith('vn');
        expect(nzI18n.setLocale).toHaveBeenCalledWith(vi_VN);
        expect(service.getCurrentLanguage()).toBe('vn');
    });

    it('uses persisted language from localStorage', () => {
        localStorage.setItem('app_language', 'en');

        service.init();

        expect(translate.use).toHaveBeenCalledWith('en');
        expect(nzI18n.setLocale).toHaveBeenCalledWith(en_US);
        expect(service.getCurrentLanguage()).toBe('en');
    });

    it('switches language and persists it', () => {
        service.setLanguage('en');

        expect(translate.use).toHaveBeenCalledWith('en');
        expect(nzI18n.setLocale).toHaveBeenCalledWith(en_US);
        expect(localStorage.getItem('app_language')).toBe('en');
    });

    it('ignores invalid persisted language and falls back to vn', () => {
        localStorage.setItem('app_language', 'jp');

        service.init();

        expect(service.getCurrentLanguage()).toBe('vn');
    });

    it('exposes supported language list', () => {
        const supported = service.getSupportedLanguages();
        expect(supported).toEqual(['en', 'vn'] as LanguageCode[]);
    });
});
