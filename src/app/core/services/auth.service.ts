import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models/user.model';
import { ApiSuccessResponse } from '../models/api-response.model';
import { environment } from '../../../environment/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';

const TOKEN_KEY = 'badminton_token';
const USER_KEY = 'badminton_user';
const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = `${environment.API_DOMAIN}/api/auth`;
    private readonly currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    private readonly notification = inject(NzNotificationService);

    constructor(private readonly http: HttpClient) {}

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    public get token(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    public login(request: LoginRequest): Observable<LoginResponse> {
        return this.http
            .post<ApiSuccessResponse<string>>(`${this.apiUrl}/login`, {
                userName: request.username,
                password: request.password
            })
            .pipe(
                map((res) => {
                    if (!res?.status) {
                        throw new Error((res as { errorMessage?: string })?.errorMessage ?? 'Login failed');
                    }
                    const token = typeof res.data === 'string' ? res.data : (res as { message?: string }).message;
                    if (!token || typeof token !== 'string') {
                        throw new Error((res as { errorMessage?: string })?.errorMessage ?? 'Login failed');
                    }
                    return token;
                }),
                switchMap((token) => this.storeTokenAndFetchUser(token)),
                tap(({ user }) => {
                    this.setUserToStorage(user);
                    this.currentUserSubject.next(user);
                    this.notification.success('', 'Signed in successfully');
                }),
                map(({ user, token }) => ({ user, token }))
            );
    }

    public register(request: RegisterRequest): Observable<LoginResponse> {
        return this.http
            .post<ApiSuccessResponse<string>>(`${this.apiUrl}/register`, {
                fullName: request.fullName,
                userName: request.userName,
                password: request.password,
                email: request.email
            })
            .pipe(
                map((res) => {
                    if (!res?.status) {
                        throw new Error((res as { errorMessage?: string })?.errorMessage ?? 'Registration failed');
                    }
                    const token = typeof res.data === 'string' ? res.data : (res as { message?: string }).message;
                    if (!token || typeof token !== 'string') {
                        throw new Error((res as { errorMessage?: string })?.errorMessage ?? 'Registration failed');
                    }
                    return token;
                }),
                switchMap((token) => this.storeTokenAndFetchUser(token)),
                tap(({ user }) => {
                    this.setUserToStorage(user);
                    this.currentUserSubject.next(user);
                    this.notification.success('', 'Account registered successfully');
                }),
                map(({ user, token }) => ({ user, token }))
            );
    }

    private storeTokenAndFetchUser(token: string): Observable<{ user: User; token: string }> {
        localStorage.setItem(TOKEN_KEY, token);
        const userId = this.getUserIdFromToken(token);
        const fallbackUser: User = {
            id: userId ?? 'unknown',
            username: userId ?? 'user',
            displayName: 'User'
        };
        if (!userId) {
            return of({ user: fallbackUser, token });
        }
        return this.http
            .get<ApiSuccessResponse<{ id: string; fullname: string; username: string; email: string; avatar?: string }>>(
                `${this.apiUrl}/user/${userId}`
            )
            .pipe(
                map((res) => {
                    if (res?.status && res.data) {
                        return {
                            user: {
                                id: res.data.id,
                                username: res.data.username,
                                displayName: res.data.fullname || res.data.username,
                                fullName: res.data.fullname,
                                email: res.data.email,
                                avatar: res.data.avatar
                            } as User,
                            token
                        };
                    }
                    return { user: fallbackUser, token };
                }),
                catchError(() => of({ user: fallbackUser, token }))
            );
    }

    private getUserIdFromToken(token: string): string | null {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload[NAME_ID_CLAIM] ?? payload.nameid ?? payload.sub ?? null;
        } catch {
            return null;
        }
    }

    public logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        this.removeUserFromStorage();
        this.currentUserSubject.next(null);
    }

    public isAuthenticated(): boolean {
        return this.currentUserValue !== null && this.token !== null;
    }

    private setUserToStorage(user: User): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    private getUserFromStorage(): User | null {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    }

    private removeUserFromStorage(): void {
        localStorage.removeItem(USER_KEY);
    }
}
