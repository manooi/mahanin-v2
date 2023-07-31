import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-accordian',
  templateUrl: './accordian.component.html',
  styleUrls: ['./accordian.component.scss']
})
export class AccordianComponent implements OnInit {
  @Input() header: string = "";
  @Input() isShowAccordians: boolean = false;
  @Input() class: string = "";

  ngOnInit(): void {
  }

  toggleAccordian() {
    this.isShowAccordians = !this.isShowAccordians;
  }
}