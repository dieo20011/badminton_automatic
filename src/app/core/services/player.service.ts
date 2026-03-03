import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import {
    Player,
    CreatePlayerRequest,
    UpdatePlayerCheckboxRequest,
    UpdatePlayerPaymentRequest,
    CheckboxUpdatedPayload
} from '../models/player.model';
import { SignalrService } from './signalr.service';
import { ApiSuccessResponse } from '../models/api-response.model';
import { environment } from '../../../environment/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
    providedIn: 'root'
})
export class PlayerService {
    private readonly apiBase = `${environment.API_DOMAIN}/api/courts`;
    private readonly playersSubject = new BehaviorSubject<Player[]>([]);
    public players$ = this.playersSubject.asObservable();

    private readonly notification = inject(NzNotificationService);

    constructor(
        private readonly http: HttpClient,
        private readonly signalrService: SignalrService
    ) {
        this.subscribeToSignalR();
    }

    private subscribeToSignalR(): void {
        this.signalrService.playerAdded$.subscribe((player: Player) => {
            const current = this.playersSubject.value;
            if (!current.find((p: Player) => p.id === player.id)) {
                this.playersSubject.next([...current, player]);
            }
        });

        this.signalrService.checkboxUpdatedPayload$.subscribe((payload: CheckboxUpdatedPayload) => {
            this.updateCheckboxLocally(payload);
        });

        this.signalrService.paymentUpdated$.subscribe((data: UpdatePlayerPaymentRequest) => {
            this.updatePaymentLocally(data);
        });
    }

    private mapPlayerFromApi(raw: {
        id: string;
        courtId: string;
        name: string;
        checkboxes: boolean[];
        isPaid: boolean;
        createdDate: string;
    }): Player {
        return {
            id: raw.id,
            courtId: raw.courtId,
            name: raw.name,
            checkboxes: Array.isArray(raw.checkboxes) ? raw.checkboxes : Array(12).fill(false),
            isPaid: !!raw.isPaid,
            createdDate: raw.createdDate ? new Date(raw.createdDate) : new Date()
        };
    }

    public loadPlayersForCourt(courtId: string): Promise<void> {
        return firstValueFrom(
            this.http.get<ApiSuccessResponse<Array<{
                id: string;
                courtId: string;
                name: string;
                checkboxes: boolean[];
                isPaid: boolean;
                createdDate: string;
            }>>>(`${this.apiBase}/${courtId}/players`)
        ).then((res) => {
            if (res?.status && Array.isArray(res.data)) {
                const newPlayers = res.data.map((p) => this.mapPlayerFromApi(p));
                const current = this.playersSubject.value;
                const others = current.filter((p: Player) => p.courtId !== courtId);
                this.playersSubject.next([...others, ...newPlayers]);
            }
        }).catch((err) => {
            console.error('Load players failed', err);
            throw err;
        });
    }

    public getPlayersByCourtId(courtId: string): Observable<Player[]> {
        return new Observable((sub) => {
            this.players$.subscribe((all) => {
                sub.next(all.filter((p: Player) => p.courtId === courtId));
            });
        });
    }

    public async addPlayer(request: CreatePlayerRequest): Promise<Player> {
        const courtId = request.courtId;
        const res = await firstValueFrom(
            this.http.post<ApiSuccessResponse<{
                id: string;
                courtId: string;
                name: string;
                checkboxes: boolean[];
                isPaid: boolean;
                createdDate: string;
            }>>(`${this.apiBase}/${courtId}/players`, request)
        );
        if (!res?.status || !res.data) {
            const msg = (res as { errorMessage?: string })?.errorMessage ?? 'Add player failed';
            throw new Error(msg);
        }
        const player = this.mapPlayerFromApi(res.data);
        const current = this.playersSubject.value;
        this.playersSubject.next([...current, player]);
        await this.signalrService.sendPlayerAdded(player);
        this.notification.success('', 'Player added successfully');
        return player;
    }

    public async updateCheckbox(
        courtId: string,
        request: UpdatePlayerCheckboxRequest,
        displayName?: string
    ): Promise<void> {
        await firstValueFrom(
            this.http.patch<ApiSuccessResponse<unknown>>(
                `${this.apiBase}/${courtId}/players/checkbox`,
                request
            )
        ).catch((err) => {
            console.error('Update checkbox failed', err);
            throw err;
        });
        await this.signalrService.sendCheckboxUpdate(courtId, request, displayName);
    }

    private updateCheckboxLocally(payload: UpdatePlayerCheckboxRequest): void {
        const current = this.playersSubject.value;
        const updated = current.map((player: Player) => {
            if (player.id === payload.playerId) {
                const arr = [...(player.checkboxes ?? [])];
                while (arr.length < 12) arr.push(false);
                arr[payload.checkboxIndex] = payload.isChecked;
                return { ...player, checkboxes: arr };
            }
            return player;
        });
        this.playersSubject.next(updated);
    }

    public async updatePaymentStatus(courtId: string, request: UpdatePlayerPaymentRequest): Promise<void> {
        await firstValueFrom(
            this.http.patch<ApiSuccessResponse<unknown>>(
                `${this.apiBase}/${courtId}/players/payment`,
                request
            )
        ).catch((err) => {
            console.error('Update payment failed', err);
            throw err;
        });
        await this.signalrService.sendPaymentUpdate(courtId, request);
        this.notification.success('', 'Payment updated successfully');
    }

    private updatePaymentLocally(request: UpdatePlayerPaymentRequest): void {
        const current = this.playersSubject.value;
        const updated = current.map((player: Player) =>
            player.id === request.playerId ? { ...player, isPaid: request.isPaid } : player
        );
        this.playersSubject.next(updated);
    }
}
