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
        return this.http.get<Measurements>('http://souperwit.3bbddns.com:37592/get-measurements');
    }
}