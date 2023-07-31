import { Component } from '@angular/core';

@Component({
  selector: 'app-resume',
  templateUrl: './resume.component.html',
  styleUrls: ['./resume.component.scss']
})
export class ResumeComponent {

  myAge!: { years: number, months: number, days: number };

  constructor() {
    this.myAge = this.getAge();
  }

  getAge(): { years: number, months: number, days: number } {
    const today: Date = new Date();
    const birth: Date = new Date('1994-10-11');

    let years: number = today.getFullYear() - birth.getFullYear();
    let months: number = today.getMonth() - birth.getMonth();
    let days: number = today.getDate() - birth.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
    }

    if (days < 0) {
      const prevMonth: Date = new Date(today.getFullYear(), today.getMonth() - 1, birth.getDate());
      const diffMs: number = today.getTime() - prevMonth.getTime();
      days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return {
      years: years,
      months: months,
      days: days,
    };
  }
}
