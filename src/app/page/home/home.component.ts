import { Component, OnInit } from '@angular/core';
import { GetSensorDataService, Measurements } from 'src/app/service/api/get-sensor-data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  measurements: Measurements = {
    temperature: 0,
    humidity: 0,
    heatIndex: 0
  };

  constructor(private getSensorDataService: GetSensorDataService) {
  }

  ngOnInit(): void {
    this.fetchData();
    setInterval(() => {
      this.fetchData();
    }, 10000);
  }

  private fetchData() {
    this.getSensorDataService.getMeasurements().subscribe({
      next: (value) => {
        this.measurements.temperature = parseFloat(value.temperature.toFixed(2));
        this.measurements.humidity = parseFloat(value.humidity.toFixed(2));
        this.measurements.heatIndex = parseFloat(value.heatIndex.toFixed(2));
      }
    });
  }
}
