import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Measurements {
    temperature: number;
    humidity: number;
    heatIndex: number;
}

@Injectable({ providedIn: 'root' })
export class GetSensorDataService {
    constructor(private http: HttpClient) {

    }

    getMeasurements() {
        return this.http.get<Measurements>('https://o7yeeof7g0.execute-api.ap-southeast-1.amazonaws.com/test/get-measurements');
    }
}