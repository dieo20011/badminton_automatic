import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Court, CreateCourtRequest } from '../models/court.model';
import { CourtSession, SaveCourtSessionRequest } from '../models/court-session.model';
import { SignalrService } from './signalr.service';
import { ApiSuccessResponse } from '../models/api-response.model';
import { environment } from '../../../environment/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class CourtService {
    private readonly apiUrl = `${environment.API_DOMAIN}/api/courts`;
    private courtsSubject = new BehaviorSubject<Court[]>([]);
    public courts$ = this.courtsSubject.asObservable();

    private readonly notification = inject(NzNotificationService);
    private readonly translate = inject(TranslateService);

    constructor(
        private http: HttpClient,
        private signalrService: SignalrService
    ) {
        this.subscribeToSignalR();
    }

    private subscribeToSignalR(): void {
        this.signalrService.courtAdded$.subscribe((court: Court) => {
            const current = this.courtsSubject.value;
            if (!current.find((c: Court) => c.id === court.id)) {
                this.courtsSubject.next([...current, court]);
            }
        });
    }

    private mapCourtFromApi(raw: { id: string; name: string; createdDate?: string; password?: string }): Court {
        return {
            id: raw.id,
            name: raw.name,
            password: raw.password ?? '',
            createdDate: raw.createdDate ? new Date(raw.createdDate) : new Date()
        };
    }

    public loadCourts(): Promise<void> {
        return firstValueFrom(
            this.http.get<ApiSuccessResponse<Array<{ id: string; name: string; createdDate: string }>>>(this.apiUrl)
        ).then((res) => {
            if (res?.status && Array.isArray(res.data)) {
                const courts = res.data.map((c) => this.mapCourtFromApi(c));
                this.courtsSubject.next(courts);
            }
        }).catch((err) => {
            console.error('Load courts failed', err);
            throw err;
        });
    }

    public getCourts(): Observable<Court[]> {
        return this.courts$;
    }

    public getCourtById(id: string): Court | undefined {
        return this.courtsSubject.value.find((c: Court) => c.id === id);
    }

    public loadCourtById(id: string): Promise<Court | null> {
        return firstValueFrom(
            this.http.get<ApiSuccessResponse<{ id: string; name: string; createdDate: string }>>(`${this.apiUrl}/${id}`)
        ).then((res) => {
            if (res?.status && res.data) {
                const court = this.mapCourtFromApi(res.data);
                const current = this.courtsSubject.value;
                const idx = current.findIndex((c) => c.id === court.id);
                if (idx >= 0) {
                    const next = [...current];
                    next[idx] = { ...court, password: next[idx].password || court.password };
                    this.courtsSubject.next(next);
                } else {
                    this.courtsSubject.next([...current, court]);
                }
                return court;
            }
            return null;
        }).catch(() => null);
    }

    public async createCourt(request: CreateCourtRequest): Promise<Court> {
        const res = await firstValueFrom(
            this.http.post<ApiSuccessResponse<{ id: string; name: string; password: string; createdDate: string }>>(
                this.apiUrl,
                request
            )
        );
        if (!res?.status || !res.data) {
            const msg = (res as { errorMessage?: string })?.errorMessage ?? this.translate.instant('courts.createCourtFailed');
            throw new Error(msg);
        }
        const court = this.mapCourtFromApi(res.data);
        const current = this.courtsSubject.value;
        this.courtsSubject.next([...current, court]);
        await this.signalrService.sendCourtAdded(court);
        this.notification.success('', this.translate.instant('courts.createCourtSuccess'));
        return court;
    }

    public verifyCourtPassword(courtId: string, password: string): Promise<boolean> {
        return firstValueFrom(
            this.http.post<ApiSuccessResponse<{ verified: boolean }>>(
                `${this.apiUrl}/${courtId}/verify-password`,
                { password }
            )
        ).then((res) => res?.status === true && res?.data?.verified === true).catch(() => false);
    }

    public async getCourtSessions(courtId: string): Promise<CourtSession[]> {
        const res = await firstValueFrom(
            this.http.get<ApiSuccessResponse<CourtSession[]>>(`${this.apiUrl}/${courtId}/sessions`)
        );
        if (!res?.status || !Array.isArray(res.data)) return [];
        return res.data.map((s) => ({ ...s, sessionDate: new Date(s.sessionDate), createdDate: new Date(s.createdDate) }));
    }

    public async saveCourtSession(courtId: string, request: SaveCourtSessionRequest): Promise<CourtSession> {
        const res = await firstValueFrom(
            this.http.post<ApiSuccessResponse<CourtSession>>(`${this.apiUrl}/${courtId}/sessions`, request)
        );
        if (!res?.status || !res.data) {
            const msg = (res as { errorMessage?: string })?.errorMessage ?? this.translate.instant('courtDetail.saveSessionFailed');
            throw new Error(msg);
        }
        return { ...res.data, sessionDate: new Date(res.data.sessionDate), createdDate: new Date(res.data.createdDate) };
    }

    public async deleteCourt(id: string): Promise<void> {
        const res = await firstValueFrom(
            this.http.delete<ApiSuccessResponse<unknown>>(`${this.apiUrl}/${id}`)
        );
        if (!res?.status) {
            const msg = (res as { errorMessage?: string })?.errorMessage ?? this.translate.instant('courts.deleteCourtFailedTitle');
            throw new Error(msg);
        }
        const current = this.courtsSubject.value.filter((c: Court) => c.id !== id);
        this.courtsSubject.next(current);
        this.notification.success('', this.translate.instant('courts.deleteCourtSuccess'));
    }
}
