import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Player, UpdatePlayerCheckboxRequest, UpdatePlayerPaymentRequest, CheckboxUpdatedPayload } from '../models/player.model';
import { Court } from '../models/court.model';
import { environment } from '../../../environment/environment';

@Injectable({
    providedIn: 'root'
})
export class SignalrService {
    private hubConnection: signalR.HubConnection | null = null;
    private readonly hubUrl = `${environment.API_DOMAIN.replace(/\/$/, '')}/courtHub`;

    public playerAdded$ = new Subject<Player>();
    public playerUpdated$ = new Subject<Player>();
    public checkboxUpdatedPayload$ = new Subject<CheckboxUpdatedPayload>();
    public paymentUpdated$ = new Subject<UpdatePlayerPaymentRequest>();
    public courtAdded$ = new Subject<Court>();
    /** Emits the displayName of the user who just joined the court room */
    public userJoined$ = new Subject<string>();
    /** Emits the displayName of the user who just left the court room */
    public userLeft$ = new Subject<string>();

    constructor() {}

    public startConnection(): Promise<void> {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.hubUrl)
            .withAutomaticReconnect()
            .build();

        return this.hubConnection
            .start()
            .then(() => {
                this.registerEventHandlers();
            })
            .catch((err: Error) => {
                console.error('SignalR connection error', err);
                return Promise.resolve();
            });
    }

    private registerEventHandlers(): void {
        if (!this.hubConnection) return;

        this.hubConnection.on('PlayerAdded', (player: Player) => {
            this.playerAdded$.next(player);
        });
        this.hubConnection.on('PlayerUpdated', (player: Player) => {
            this.playerUpdated$.next(player);
        });
        this.hubConnection.on('CheckboxUpdated', (data: CheckboxUpdatedPayload) => {
            this.checkboxUpdatedPayload$.next(data);
        });
        this.hubConnection.on('PaymentUpdated', (data: UpdatePlayerPaymentRequest) => {
            this.paymentUpdated$.next(data);
        });
        this.hubConnection.on('CourtAdded', (court: Court) => {
            this.courtAdded$.next(court);
        });
        this.hubConnection.on('UserJoined', (displayName: string) => {
            this.userJoined$.next(displayName);
        });
        this.hubConnection.on('UserLeft', (displayName: string) => {
            this.userLeft$.next(displayName);
        });
    }

    public async joinCourt(courtId: string, password: string, displayName?: string): Promise<void> {
        if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) return;
        await this.hubConnection.invoke('JoinCourt', courtId, password, displayName ?? null);
    }

    public async leaveCourt(courtId: string): Promise<void> {
        if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) return;
        await this.hubConnection.invoke('LeaveCourt', courtId);
    }

    public async sendCourtAdded(court: Court): Promise<void> {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('BroadcastCourtAdded', court);
        }
    }

    public async sendPlayerAdded(player: Player): Promise<void> {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('BroadcastPlayerAdded', player.courtId, player);
        }
    }

    public async sendCheckboxUpdate(
        courtId: string,
        data: UpdatePlayerCheckboxRequest,
        displayName?: string
    ): Promise<void> {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke(
                'BroadcastCheckboxUpdate',
                courtId,
                data.playerId,
                data.checkboxIndex,
                data.isChecked,
                displayName ?? null
            );
        }
    }

    public async sendPaymentUpdate(courtId: string, data: UpdatePlayerPaymentRequest): Promise<void> {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('BroadcastPaymentUpdate', courtId, data);
        }
    }

    public stopConnection(): void {
        if (this.hubConnection) {
            this.hubConnection.stop();
        }
    }
}
