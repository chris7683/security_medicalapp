import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';
import { fadeIn, scaleIn } from '../../animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [fadeIn, scaleIn]
})
export class HomeComponent {
  constructor(private router: Router, public auth: AuthService) {}

  getStarted() {
    if (this.auth.isAuthenticated) this.router.navigateByUrl('/dashboard');
    else this.router.navigateByUrl('/login');
  }
}


