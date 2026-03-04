import { Component, OnInit, OnDestroy } from '@angular/core';
import { noWhitespaceValidator } from '../../../core/validators/form.validators';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CourtService } from '../../../core/services/court.service';
import { PlayerService } from '../../../core/services/player.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { Court } from '../../../core/models/court.model';
import {
    Player,
    CreatePlayerRequest,
    UpdatePlayerCheckboxRequest,
    UpdatePlayerPaymentRequest,
    CheckboxUpdatedPayload
} from '../../../core/models/player.model';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CHECKBOX_COLORS } from './court-detail.const';

@Component({
    selector: 'app-court-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NzModalModule],
    templateUrl: './court-detail.component.html',
    styleUrls: ['./court-detail.component.scss']
})
export class CourtDetailComponent implements OnInit, OnDestroy {
    court: Court | undefined;
    players: Player[] = [];
    showPasswordDialog = true;
    passwordForm: FormGroup;
    passwordError = '';
    addPlayerForm: FormGroup;
    isAddingPlayer = false;
    checkboxNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
    /** Who last updated each cell (playerId-index -> updatedBy) for coloring */
    checkboxUpdatedByMap = new Map<string, string>();
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly fb: FormBuilder,
        private readonly courtService: CourtService,
        private readonly playerService: PlayerService,
        private readonly signalrService: SignalrService,
        private readonly modal: NzModalService,
        private readonly notification: NzNotificationService
    ) {
        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]],
            displayName: ['', [Validators.maxLength(50)]]
        });
        this.addPlayerForm = this.fb.group({
            playerName: ['', [Validators.required, Validators.minLength(2), noWhitespaceValidator]]
        });
    }

    ngOnInit(): void {
        this.subscribeToCheckboxPayload();
        const courtId = this.route.snapshot.paramMap.get('id');
        if (!courtId) {
            this.router.navigate(['/courts']);
            return;
        }
        this.court = this.courtService.getCourtById(courtId);
        if (this.court) return;
        this.courtService.loadCourtById(courtId).then((c) => {
            this.court = c ?? undefined;
            if (!this.court) this.router.navigate(['/courts']);
        });
    }

    private subscribeToCheckboxPayload(): void {
        this.signalrService.checkboxUpdatedPayload$
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: CheckboxUpdatedPayload) => {
                if (!payload || payload.playerId === undefined) return;
                const key = `${payload.playerId}-${payload.checkboxIndex}`;
                if (payload.updatedBy) this.checkboxUpdatedByMap.set(key, payload.updatedBy);
            });
    }

    ngOnDestroy(): void {
        if (this.court?.id) this.signalrService.leaveCourt(this.court.id);
        this.destroy$.next();
        this.destroy$.complete();
    }

    async verifyPassword(): Promise<void> {
        this.markFormGroupTouched(this.passwordForm);
        if (this.passwordForm.invalid || !this.court) return;
        const password = this.passwordForm.value.password as string;
        const displayName = (this.passwordForm.value.displayName as string)?.trim() || undefined;
        const isValid = await this.courtService.verifyCourtPassword(this.court.id, password);
        if (!isValid) {
            this.passwordError = 'Invalid password. Please try again.';
            return;
        }
        this.passwordError = '';
        this.showPasswordDialog = false;
        await this.signalrService.joinCourt(this.court.id, password, displayName);
        this.notification.success('', 'Joined court successfully');
        this.loadPlayers();
    }

    private loadPlayers(): void {
        if (!this.court) return;
        this.playerService.loadPlayersForCourt(this.court.id).then(() => {});
        this.playerService.getPlayersByCourtId(this.court.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((players: Player[]) => {
                this.players = players;
            });
    }

    async addPlayer(): Promise<void> {
        if (this.addPlayerForm.invalid || !this.court) {
            this.markFormGroupTouched(this.addPlayerForm);
            return;
        }
        this.isAddingPlayer = true;
        const request: CreatePlayerRequest = {
            courtId: this.court.id,
            name: (this.addPlayerForm.value.playerName as string).trim()
        };
        try {
            await this.playerService.addPlayer(request);
            this.addPlayerForm.reset();
        } catch (e) {
            console.error('Add player failed', e);
        }
        this.isAddingPlayer = false;
    }

    async toggleCheckbox(player: Player, index: number): Promise<void> {
        if (!this.court) return;
        const request: UpdatePlayerCheckboxRequest = {
            playerId: player.id,
            checkboxIndex: index,
            isChecked: !player.checkboxes[index]
        };
        const displayName = (this.passwordForm.value.displayName as string)?.trim() || undefined;
        try {
            await this.playerService.updateCheckbox(this.court.id, request, displayName);
        } catch (e) {
            console.error('Update checkbox failed', e);
        }
    }

    async togglePayment(player: Player): Promise<void> {
        if (!this.court) return;
        const request: UpdatePlayerPaymentRequest = {
            playerId: player.id,
            isPaid: !player.isPaid
        };
        try {
            await this.playerService.updatePaymentStatus(this.court.id, request);
        } catch (e) {
            console.error('Update payment failed', e);
        }
    }

    getCheckedCount(player: Player): number {
        return (player.checkboxes ?? []).filter(Boolean).length;
    }

    /** Cell background: by who ticked (SignalR) if known, else by player so each row has a distinct color. */
    getCellColor(playerId: string, index: number): string {
        const key = `${playerId}-${index}`;
        const updatedBy = this.checkboxUpdatedByMap.get(key);
        if (updatedBy) return this.getColorForUser(updatedBy);
        return this.getColorForPlayer(playerId);
    }

    private getColorForUser(updatedBy: string): string {
        const n = updatedBy.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return CHECKBOX_COLORS[Math.abs(n) % CHECKBOX_COLORS.length];
    }

    private getColorForPlayer(playerId: string): string {
        const n = playerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return CHECKBOX_COLORS[Math.abs(n) % CHECKBOX_COLORS.length];
    }

    /** Unique participants who have ticked at least one checkbox (for color legend). */
    get participantLegendItems(): Array<{ displayName: string; color: string }> {
        const seen = new Set<string>();
        const items: Array<{ displayName: string; color: string }> = [];
        this.checkboxUpdatedByMap.forEach((displayName) => {
            if (displayName && !seen.has(displayName)) {
                seen.add(displayName);
                items.push({ displayName, color: this.getColorForUser(displayName) });
            }
        });
        return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    goBack(): void {
        this.router.navigate(['/courts']);
    }

    deleteCourt(): void {
        if (!this.court) return;
        const courtName = this.court.name;
        const courtId = this.court.id;
        this.modal.confirm({
            nzTitle: 'Delete Court',
            nzContent: `Are you sure you want to delete "${courtName}"? All players in this court will also be removed.`,
            nzOkText: 'Delete',
            nzCancelText: 'Cancel',
            nzOkDanger: true,
            nzOnOk: () =>
                this.courtService.deleteCourt(courtId).then(() => {
                    this.router.navigate(['/courts']);
                }).catch((err) => {
                    console.error('Delete court failed', err);
                    this.modal.error({
                        nzTitle: 'Failed to delete court',
                        nzContent: err instanceof Error ? err.message : 'An error occurred. Please try again.'
                    });
                    return Promise.reject(err);
                })
        });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key: string) => {
            formGroup.get(key)?.markAsTouched();
        });
    }

    get playerName() {
        return this.addPlayerForm.get('playerName');
    }
}
