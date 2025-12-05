import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { MedicationListComponent } from '../medication-list/medication-list.component';
import { fadeIn } from '../../animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MedicationListComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: [fadeIn]
})
export class ProfileComponent implements OnInit {
  apiBase = 'http://localhost:4000/api';
  me$: Observable<any>;

  constructor(private http: HttpClient, private auth: AuthService) {
    const userStr = localStorage.getItem('currentUser');
    const userId = userStr ? JSON.parse(userStr).id : '';
    this.me$ = this.http.get<any>(`${this.apiBase}/patients/${userId}`);
  }

  ngOnInit() {}
}
