export interface CourtSessionPlayerSnapshot {
    playerId: string;
    name: string;
    checkedSets: number;
    isPaid: boolean;
}

export interface CourtSession {
    id: string;
    courtId: string;
    sessionDate: Date;
    notes: string;
    courtFee: number;
    shuttlecockCount: number;
    shuttlecockPrice: number;
    waterFee: number;
    maleCount: number;
    femaleCount: number;
    maleFixedFee: number;
    femaleFixedFee: number;
    malePerPerson: number;
    femalePerPerson: number;
    totalCost: number;
    players: CourtSessionPlayerSnapshot[];
    createdDate: Date;
}

export interface SaveCourtSessionRequest {
    sessionDate: Date;
    notes: string;
    courtFee: number;
    shuttlecockCount: number;
    shuttlecockPrice: number;
    waterFee: number;
    maleCount: number;
    femaleCount: number;
    maleFixedFee: number;
    femaleFixedFee: number;
    malePerPerson: number;
    femalePerPerson: number;
    totalCost: number;
    players: CourtSessionPlayerSnapshot[];
}

export interface PriceCalcResult {
    totalShuttlecock: number;
    totalCost: number;
    malePerPerson: number;
    femalePerPerson: number;
    maleTotalPay: number;
    femaleTotalPay: number;
    surplus: number;
}
