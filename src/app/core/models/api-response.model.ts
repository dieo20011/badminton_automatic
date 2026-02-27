export interface ApiSuccessResponse<T> {
    status: true;
    message?: string;
    data?: T;
}

export interface ApiErrorResponse {
    status: false;
    errorMessage?: string;
}
