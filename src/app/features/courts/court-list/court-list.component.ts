import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CourtService } from '../../../core/services/court.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { Court } from '../../../core/models/court.model';
import { AddCourtDialogComponent } from '../add-court-dialog/add-court-dialog.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
    selector: 'app-court-list',
    standalone: true,
    imports: [CommonModule, NzModalModule, AddCourtDialogComponent],
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
        private readonly router: Router,
        private readonly modal: NzModalService,
        private readonly notification: NzNotificationService
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

    logout(): void {
        this.authService.logout();
        this.notification.success('success', 'Logout successfully');
        this.router.navigate(['/login']);
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    deleteCourt(event: Event, court: Court): void {
        event.stopPropagation();
        this.modal.confirm({
            nzTitle: 'Xóa sân',
            nzContent: `Bạn có chắc muốn xóa sân "${court.name}"? Tất cả người chơi thuộc sân này cũng sẽ bị xóa.`,
            nzOkText: 'Xóa',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () =>
                this.courtService.deleteCourt(court.id).catch((err) => {
                    console.error('Delete court failed', err);
                    this.modal.error({
                        nzTitle: 'Không thể xóa sân',
                        nzContent: err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.'
                    });
                    return Promise.reject(err);
                })
        });
    }
}
