export interface Court {
    id: string;
    name: string;
    password: string;
    createdDate: Date;
}

export interface CreateCourtRequest {
    name: string;
    password: string;
}
