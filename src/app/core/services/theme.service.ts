import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const THEME_KEY = 'badminton-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly isDark = signal<boolean>(false);

    constructor() {
        const theme = this.loadPreference();
        this.isDark.set(theme === 'dark');
        this.applyTheme(theme);
    }

    toggle(): void {
        const next = !this.isDark();
        const theme: Theme = next ? 'dark' : 'light';
        this.isDark.set(next);
        this.applyTheme(theme);
        localStorage.setItem(THEME_KEY, theme);
    }

    private loadPreference(): Theme {
        const stored = localStorage.getItem(THEME_KEY) as Theme | null;
        if (stored === 'dark' || stored === 'light') return stored;
        return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    private applyTheme(theme: Theme): void {
        document.documentElement.dataset['theme'] = theme;
    }
}
