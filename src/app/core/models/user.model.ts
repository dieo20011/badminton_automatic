export interface User {
    id: string;
    username: string;
    displayName: string;
    fullName?: string;
    email?: string;
    avatar?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    userName: string;
    password: string;
    email: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}
