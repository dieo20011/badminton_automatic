export interface Player {
    id: string;
    courtId: string;
    name: string;
    checkboxes: boolean[];
    isPaid: boolean;
    createdDate: Date;
}

export interface CreatePlayerRequest {
    courtId: string;
    name: string;
}

export interface UpdatePlayerCheckboxRequest {
    playerId: string;
    checkboxIndex: number;
    isChecked: boolean;
}

/** Payload from SignalR when someone checks a set; includes who did it for coloring */
export interface CheckboxUpdatedPayload extends UpdatePlayerCheckboxRequest {
    updatedBy?: string;
}

export interface UpdatePlayerPaymentRequest {
    playerId: string;
    isPaid: boolean;
}
