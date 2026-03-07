import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GlobalSniperComponent } from './shared/global-sniper/global-sniper.component';
import { ThemeService } from './core/services/theme.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageCode, LanguageService } from './core/services/language.service';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, GlobalSniperComponent, TranslateModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    title = 'badminton_automatic';
    readonly supportedLanguages: LanguageCode[];

    constructor(
        readonly themeService: ThemeService,
        readonly languageService: LanguageService
    ) {
        this.supportedLanguages = this.languageService.getSupportedLanguages();
    }

    switchLanguage(language: LanguageCode): void {
        this.languageService.setLanguage(language);
    }
}
