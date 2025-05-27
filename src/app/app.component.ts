import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <!-- <header class="lane-switcher">
      <button routerLink="/lane/680bc0" routerLinkActive="active-lane">Lane 1 (ID: 680bc0)</button>
      <button routerLink="/lane/64958d" routerLinkActive="active-lane">Lane 2 (ID: 64958d)</button>
    </header> -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'drive-thru-visualizer';
}