// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'lane/680bc0', pathMatch: 'full' }, // Default to Lane 1
  { path: 'lane/:id', component: DashboardComponent },
  { path: '**', redirectTo: 'lane/680bc0' } // Wildcard for unknown routes
];