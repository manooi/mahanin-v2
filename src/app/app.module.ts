import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ResumeComponent } from './page/resume/resume.component';
import { AccordianComponent } from './shared/components/accordian/accordian.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './page/home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { StepperComponent } from './shared/components/stepper/stepper.component';
import { VStepperComponent } from './shared/components/v-stepper/v-stepper.component';

@NgModule({
  declarations: [
    AppComponent,
    ResumeComponent,
    AccordianComponent,
    HomeComponent,
    StepperComponent,
    VStepperComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
