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
import { CourtSession, PriceCalcResult, SaveCourtSessionRequest } from '../../../core/models/court-session.model';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CHECKBOX_COLORS } from './court-detail.const';

export interface ActivityLogEntry {
    id: number;
    time: Date;
    type: 'join' | 'leave' | 'checkbox' | 'player' | 'payment';
    message: string;
    actor?: string;
}

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
    checkboxUpdatedByMap = new Map<string, string>();

    // Active members in room: displayName → color
    activeMembers = new Map<string, string>();
    // Realtime activity log (max 50 entries, newest first)
    activityLog: ActivityLogEntry[] = [];
    private logIdCounter = 0;

    // Price calculator
    showPriceCalc = false;
    priceCalcForm: FormGroup;
    calcResult: PriceCalcResult | null = null;
    isSavingSession = false;

    // History
    showHistory = false;
    courtSessions: CourtSession[] = [];
    isLoadingHistory = false;
    expandedSessionId: string | null = null;

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
            displayName: ['', [Validators.required, Validators.maxLength(50)]]
        });
        this.addPlayerForm = this.fb.group({
            playerName: ['', [Validators.required, Validators.minLength(2), noWhitespaceValidator]]
        });
        this.priceCalcForm = this.fb.group({
            courtFee: [0, [Validators.min(0)]],
            shuttlecockCount: [0, [Validators.min(0)]],
            shuttlecockPrice: [25000, [Validators.min(0)]],
            waterFee: [0, [Validators.min(0)]],
            maleCount: [0, [Validators.min(0)]],
            femaleCount: [0, [Validators.min(0)]],
            maleFixedFee: [75000, [Validators.min(0)]],
            femaleFixedFee: [0, [Validators.min(0)]],
            notes: [''],
            sessionDate: [new Date()]
        });
        this.priceCalcForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calculatePrice());
    }

    ngOnInit(): void {
        this.subscribeToCheckboxPayload();
        this.subscribeToUserEvents();
        this.subscribeToPlayerEvents();
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

                const selfName = (this.passwordForm.value.displayName as string)?.trim() || 'You';
                const isSelf = payload.updatedBy === selfName;
                if (isSelf) return;

                const actor = payload.updatedBy ?? 'Someone';
                const player = this.players.find((p) => p.id === payload.playerId);
                const playerName = player?.name ?? 'player';
                const action = payload.isChecked ? 'checked' : 'unchecked';
                this.addLog({
                    type: 'checkbox',
                    actor,
                    message: `${actor} ${action} set ${payload.checkboxIndex + 1} for ${playerName}`
                });
            });
    }

    private subscribeToUserEvents(): void {
        this.signalrService.userJoined$.pipe(takeUntil(this.destroy$)).subscribe((name: string) => {
            this.activeMembers.set(name, this.getColorForUser(name));
            this.addLog({ type: 'join', actor: name, message: `${name} joined the room` });
        });
        this.signalrService.userLeft$.pipe(takeUntil(this.destroy$)).subscribe((name: string) => {
            this.activeMembers.delete(name);
            this.addLog({ type: 'leave', actor: name, message: `${name} left the room` });
        });
    }

    private subscribeToPlayerEvents(): void {
        this.signalrService.playerAdded$.pipe(takeUntil(this.destroy$)).subscribe((player: Player) => {
            this.addLog({ type: 'player', message: `Player added: ${player.name}` });
        });
        this.signalrService.paymentUpdated$.pipe(takeUntil(this.destroy$)).subscribe((req: UpdatePlayerPaymentRequest) => {
            const player = this.players.find((p) => p.id === req.playerId);
            const name = player?.name ?? 'player';
            this.addLog({ type: 'payment', message: `${name}: ${req.isPaid ? 'payment collected' : 'payment pending'}` });
        });
    }

    private addLog(entry: Omit<ActivityLogEntry, 'id' | 'time'>): void {
        const log: ActivityLogEntry = { ...entry, id: ++this.logIdCounter, time: new Date() };
        this.activityLog = [log, ...this.activityLog].slice(0, 50);
    }

    trackActivityEntry(_: number, entry: ActivityLogEntry): number {
        return entry.id;
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
        const selfName = displayName ?? 'You';
        this.activeMembers.set(selfName, this.getColorForUser(selfName));
        this.addLog({ type: 'join', actor: selfName, message: `${selfName} joined the room` });
        this.notification.success('', 'Successfully joined the room');
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
        const isChecked = !player.checkboxes[index];
        const request: UpdatePlayerCheckboxRequest = {
            playerId: player.id,
            checkboxIndex: index,
            isChecked
        };
        const displayName = (this.passwordForm.value.displayName as string)?.trim() || undefined;
        const actor = displayName ?? 'You';
        const action = isChecked ? 'checked' : 'unchecked';
        this.addLog({
            type: 'checkbox',
            actor,
            message: `${actor} ${action} set ${index + 1} for ${player.name}`
        });
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

    /** People currently in the room (joined via SignalR). */
    get participantLegendItems(): Array<{ displayName: string; color: string }> {
        return Array.from(this.activeMembers.entries())
            .map(([displayName, color]) => ({ displayName, color }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    // ---- Price Calculator ----
    openPriceCalc(): void {
        const maleCount = this.players.length;
        this.priceCalcForm.patchValue({ maleCount, femaleCount: 0, sessionDate: new Date() });
        this.calculatePrice();
        this.showPriceCalc = true;
    }

    closePriceCalc(): void {
        this.showPriceCalc = false;
        this.calcResult = null;
    }

    calculatePrice(): void {
        const v = this.priceCalcForm.value as {
            courtFee: number; shuttlecockCount: number; shuttlecockPrice: number;
            waterFee: number; maleCount: number; femaleCount: number;
            maleFixedFee: number; femaleFixedFee: number;
        };
        const courtFee = Number(v.courtFee) || 0;
        const shuttlecockTotal = (Number(v.shuttlecockCount) || 0) * (Number(v.shuttlecockPrice) || 0);
        const waterFee = Number(v.waterFee) || 0;
        const totalCost = courtFee + shuttlecockTotal + waterFee;
        const maleCount = Number(v.maleCount) || 0;
        const femaleCount = Number(v.femaleCount) || 0;
        const totalPeople = maleCount + femaleCount;
        const maleFixedFee = Number(v.maleFixedFee) || 0;
        const femaleFixedFee = Number(v.femaleFixedFee) || 0;

        let malePerPerson = 0;
        let femalePerPerson = 0;

        if (maleFixedFee > 0 && femaleFixedFee > 0) {
            malePerPerson = maleFixedFee;
            femalePerPerson = femaleFixedFee;
        } else if (maleFixedFee > 0 && femaleFixedFee === 0) {
            malePerPerson = maleFixedFee;
            const malePays = maleCount * maleFixedFee;
            const remainder = totalCost - malePays;
            femalePerPerson = femaleCount > 0 ? Math.ceil(remainder / femaleCount) : 0;
        } else if (femaleFixedFee > 0 && maleFixedFee === 0) {
            femalePerPerson = femaleFixedFee;
            const femalePays = femaleCount * femaleFixedFee;
            const remainder = totalCost - femalePays;
            malePerPerson = maleCount > 0 ? Math.ceil(remainder / maleCount) : 0;
        } else {
            const perPerson = totalPeople > 0 ? Math.ceil(totalCost / totalPeople) : 0;
            malePerPerson = perPerson;
            femalePerPerson = perPerson;
        }

        const maleTotalPay = maleCount * malePerPerson;
        const femaleTotalPay = femaleCount * femalePerPerson;
        const surplus = maleTotalPay + femaleTotalPay - totalCost;

        this.calcResult = {
            totalShuttlecock: shuttlecockTotal,
            totalCost,
            malePerPerson,
            femalePerPerson,
            maleTotalPay,
            femaleTotalPay,
            surplus
        };
    }

    async saveSession(): Promise<void> {
        if (!this.court || !this.calcResult) return;
        this.isSavingSession = true;
        const v = this.priceCalcForm.value;
        const request: SaveCourtSessionRequest = {
            sessionDate: v.sessionDate ?? new Date(),
            notes: v.notes?.trim() ?? '',
            courtFee: Number(v.courtFee) || 0,
            shuttlecockCount: Number(v.shuttlecockCount) || 0,
            shuttlecockPrice: Number(v.shuttlecockPrice) || 0,
            waterFee: Number(v.waterFee) || 0,
            maleCount: Number(v.maleCount) || 0,
            femaleCount: Number(v.femaleCount) || 0,
            maleFixedFee: Number(v.maleFixedFee) || 0,
            femaleFixedFee: Number(v.femaleFixedFee) || 0,
            malePerPerson: this.calcResult.malePerPerson,
            femalePerPerson: this.calcResult.femalePerPerson,
            totalCost: this.calcResult.totalCost,
            players: this.players.map((p) => ({
                playerId: p.id,
                name: p.name,
                checkedSets: this.getCheckedCount(p),
                isPaid: p.isPaid
            }))
        };
        try {
            const saved = await this.courtService.saveCourtSession(this.court.id, request);
            this.courtSessions = [saved, ...this.courtSessions];
            this.notification.success('', 'Session saved successfully');
            this.closePriceCalc();
        } catch (err) {
            console.error('Save session failed', err);
            this.notification.error('', err instanceof Error ? err.message : 'Failed to save session');
        } finally {
            this.isSavingSession = false;
        }
    }

    // ---- History ----
    async toggleHistory(): Promise<void> {
        this.showHistory = !this.showHistory;
        if (this.showHistory && this.courtSessions.length === 0 && this.court) {
            await this.loadHistory();
        }
    }

    private async loadHistory(): Promise<void> {
        if (!this.court) return;
        this.isLoadingHistory = true;
        try {
            this.courtSessions = await this.courtService.getCourtSessions(this.court.id);
        } catch (err) {
            console.error('Load history failed', err);
        } finally {
            this.isLoadingHistory = false;
        }
    }

    toggleSessionExpand(sessionId: string): void {
        this.expandedSessionId = this.expandedSessionId === sessionId ? null : sessionId;
    }

    formatTime(date: Date): string {
        return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    formatSessionDate(date: Date): string {
        return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
