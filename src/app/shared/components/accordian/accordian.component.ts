import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-accordian',
  templateUrl: './accordian.component.html',
  styleUrls: ['./accordian.component.scss']
})
export class AccordianComponent implements OnInit {
  @Input() header: string = "";
  isShowAccordians: boolean = true;

  ngOnInit(): void {
  }

  toggleAccordian() {
    this.isShowAccordians = !this.isShowAccordians;
  }
}