import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <header class="lane-switcher">
      <button routerLink="/lane/680bc0" routerLinkActive="active-lane">Lane 1 (ID: 680bc0)</button>
      <button routerLink="/lane/64958d" routerLinkActive="active-lane">Lane 2 (ID: 64958d)</button>
    </header>
    <router-outlet></router-outlet>
  `,
  styles: `
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: sans-serif;
      background-color: #f0f0f0;
      display: flex;
      flex-direction: column;
    }
    .lane-switcher {
      padding: 10px;
      background-color: #333;
      color: white;
      text-align: center;
      flex-shrink: 0; /* Don't let it shrink */
    }
    .lane-switcher button {
      background-color: #555;
      color: white;
      border: 1px solid #777;
      padding: 8px 15px;
      margin: 0 5px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .lane-switcher button:hover {
      background-color: #777;
    }
    .lane-switcher button.active-lane {
      background-color: #007bff;
      border-color: #007bff;
    }
  `
})
export class AppComponent {
  title = 'drive-thru-visualizer';
}