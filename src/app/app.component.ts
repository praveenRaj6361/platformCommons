import { Component } from '@angular/core';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'ecommerce-platform';
}