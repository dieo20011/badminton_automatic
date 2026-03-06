import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalSniperComponent } from './shared/global-sniper/global-sniper.component';
import { ThemeService } from './core/services/theme.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, GlobalSniperComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    title = 'badminton_automatic';

    constructor(readonly themeService: ThemeService) {}
}
