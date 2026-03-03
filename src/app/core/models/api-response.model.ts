export interface ApiSuccessResponse<T> {
    status: true;
    message?: string;
    data?: T;
}

export interface ApiErrorResponse {
    status: false;
    errorMessage?: string;
}

export interface SuccessResult<T> {
    status: true;
  
    message: string;
    data: T;
  }
  
  export interface ErrorResult {
    status: false;
    errorMessage: string;
  }

export type ApiResponse<T> = SuccessResult<T> | ErrorResult;