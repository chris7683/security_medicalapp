import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../core/auth.service';
import { fadeIn } from '../../animations';

// API base URL - automatically uses HTTPS if available
const apiBase = (() => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol; // 'http:' or 'https:'
    const hostname = window.location.hostname;
    
    // If on HTTPS, use HTTPS for API (development: port 4443, production: same host)
    if (protocol === 'https:') {
      const port = hostname === 'localhost' ? ':4443' : '';
      return `https://${hostname}${port}/api`;
    }
  }
  
  // Default: HTTP for development
  return 'http://localhost:4000/api';
})();

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss',
  animations: [fadeIn]
})
export class AppointmentListComponent implements OnInit {
  appointments: any[] = [];
  displayedColumns: string[] = [];
  loading = false;
  userRole: string | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.userRole = this.auth.role;
    this.setupColumns();
    this.loadAppointments();
  }

  setupColumns() {
    if (this.userRole === 'doctor') {
      this.displayedColumns = ['id', 'patient', 'date', 'status', 'actions'];
    } else if (this.userRole === 'patient') {
      this.displayedColumns = ['id', 'doctor', 'date', 'status', 'diagnosis'];
    }
  }

  loadAppointments() {
    this.loading = true;
    console.log('Loading appointments from:', `${apiBase}/appointments`);
    this.http.get<any[]>(`${apiBase}/appointments`).subscribe({
      next: (data) => {
        console.log('Appointments loaded:', data?.length || 0, 'records');
        console.log('Appointments data:', data);
        this.appointments = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/appointments`
        });
        alert(`Failed to load appointments: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
        this.loading = false;
      },
    });
  }

  updateStatus(appointmentId: number, status: string) {
    this.http.put(`${apiBase}/appointments/${appointmentId}`, { status }).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => alert(err?.error?.message || 'Failed to update appointment'),
    });
  }

  deleteAppointment(id: number) {
    if (!confirm('Delete this appointment?')) return;
    this.http.delete(`${apiBase}/appointments/${id}`).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => alert(err?.error?.message || 'Failed to delete appointment'),
    });
  }
}

