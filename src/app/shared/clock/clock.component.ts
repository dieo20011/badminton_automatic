import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
    selector: 'app-clock',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="clock-widget">
            <span class="clock-date">{{ currentDate() }}</span>
            <span class="clock-time">{{ currentTime() }}</span>
        </div>
    `,
    styles: [`
        .clock-widget {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.05rem;
            padding: 0.4rem 0.75rem;
            background: var(--color-surface-muted);
            border: 1px solid var(--color-border);
            border-radius: 10px;
        }

        .clock-date {
            font-size: 0.7rem;
            font-weight: 500;
            color: var(--color-text-secondary);
            letter-spacing: 0.02em;
            white-space: nowrap;
        }

        .clock-time {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--color-text-primary);
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.05em;
            white-space: nowrap;
        }

        @media (max-width: 480px) {
            .clock-widget {
                padding: 0.3rem 0.5rem;
            }

            .clock-time {
                font-size: 0.95rem;
            }

            .clock-date {
                font-size: 0.6rem;
            }
        }
    `]
})
export class ClockComponent implements OnInit, OnDestroy {
    readonly currentDate = signal<string>('');
    readonly currentTime = signal<string>('');
    private intervalId?: ReturnType<typeof setInterval>;
    constructor(private readonly languageService: LanguageService) {}

    ngOnInit(): void {
        this.tick();
        this.intervalId = setInterval(() => this.tick(), 1000);
    }

    ngOnDestroy(): void {
        if (this.intervalId !== undefined) clearInterval(this.intervalId);
    }

    private tick(): void {
        const now = new Date();
        const localeCode = this.languageService.getCurrentLocaleCode();
        this.currentDate.set(
            now.toLocaleDateString(localeCode, {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        );
        this.currentTime.set(
            now.toLocaleTimeString(localeCode, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
        );
    }
}
