import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CourtService } from '../../../core/services/court.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Court } from '../../../core/models/court.model';
import { AddCourtDialogComponent } from '../add-court-dialog/add-court-dialog.component';
import { ClockComponent } from '../../../shared/clock/clock.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';

@Component({
    selector: 'app-court-list',
    standalone: true,
    imports: [CommonModule, NzModalModule, AddCourtDialogComponent, ClockComponent, TranslateModule],
    templateUrl: './court-list.component.html',
    styleUrls: ['./court-list.component.scss']
})
export class CourtListComponent implements OnInit, OnDestroy {
    courts: Court[] = [];
    showAddDialog = false;
    currentUser$;
    readonly leafIndices = Array.from({ length: 18 }, (_, i) => i);
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly courtService: CourtService,
        private readonly authService: AuthService,
        private readonly signalrService: SignalrService,
        readonly themeService: ThemeService,
        private readonly router: Router,
        private readonly modal: NzModalService,
        private readonly notification: NzNotificationService,
        private readonly translate: TranslateService,
        private readonly languageService: LanguageService
    ) {
        this.currentUser$ = this.authService.currentUser$;
    }

    ngOnInit(): void {
        this.signalrService.startConnection();
        this.courtService.getCourts().pipe(takeUntil(this.destroy$)).subscribe((courts: Court[]) => {
            this.courts = courts;
        });
        this.courtService.loadCourts();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    openAddDialog(): void {
        this.showAddDialog = true;
    }

    closeAddDialog(): void {
        this.showAddDialog = false;
    }

    onCourtAdded(): void {
        this.showAddDialog = false;
    }

    navigateToCourt(court: Court): void {
        this.router.navigate(['/courts', court.id]);
    }

    toggleTheme(): void {
        this.themeService.toggle();
    }

    logout(): void {
        this.authService.logout();
        this.notification.success('success', this.translate.instant('courts.logoutSuccess'));
        this.router.navigate(['/login']);
    }

    trackById(_index: number, court: Court): string {
        return court.id;
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString(this.languageService.getCurrentLocaleCode(), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    deleteCourt(event: Event, court: Court): void {
        event.stopPropagation();
        this.modal.confirm({
            nzTitle: this.translate.instant('courts.deleteCourtTitle'),
            nzContent: this.translate.instant('courts.deleteCourtContent', { name: court.name }),
            nzOkText: this.translate.instant('common.delete'),
            nzCancelText: this.translate.instant('common.cancel'),
            nzOkDanger: true,
            nzOnOk: () =>
                this.courtService.deleteCourt(court.id).catch((err) => {
                    console.error('Delete court failed', err);
                    this.modal.error({
                        nzTitle: this.translate.instant('courts.deleteCourtFailedTitle'),
                        nzContent: err instanceof Error ? err.message : this.translate.instant('courts.genericErrorRetry')
                    });
                    return Promise.reject(err);
                })
        });
    }
}
