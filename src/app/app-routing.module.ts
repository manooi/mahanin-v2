import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResumeComponent } from './page/resume/resume.component';

const routes: Routes = [
  { path: 'resume', component: ResumeComponent },
  { path: '', redirectTo: 'resume', pathMatch: 'prefix' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
