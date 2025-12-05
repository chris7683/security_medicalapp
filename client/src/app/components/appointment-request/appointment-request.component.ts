import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../core/auth.service';
import { fadeIn } from '../../animations';

// API base URL - automatically uses HTTPS if available
const getApiBase = (): string => {
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
};

@Component({
  selector: 'app-appointment-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './appointment-request.component.html',
  styleUrl: './appointment-request.component.scss',
  animations: [fadeIn]
})
export class AppointmentRequestComponent implements OnInit {
  form = this.fb.group({
    doctorId: ['', [Validators.required]],
    appointmentDate: ['', [Validators.required]],
    notes: [''],
  });

  doctors: any[] = [];
  loading = false;
  error: string | null = null;
  success = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    const apiBase = getApiBase();
    console.log('Loading doctors from:', `${apiBase}/users/doctors`);
    this.http.get<any[]>(`${apiBase}/users/doctors`).subscribe({
      next: (users) => {
        console.log('Doctors loaded:', users?.length || 0, 'doctors');
        console.log('Doctors data:', users);
        this.doctors = users || [];
        if (this.doctors.length === 0) {
          console.warn('No doctors found in the system');
        }
      },
      error: (err) => {
        console.error('Failed to load doctors', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/users/doctors`
        });
        this.error = `Failed to load doctors: ${err?.error?.message || err?.message || 'Unknown error'}`;
        alert(`Failed to load doctors: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.success = false;

    const userStr = localStorage.getItem('currentUser');
    const userId = userStr ? JSON.parse(userStr).id : null;
    if (!userId) {
      this.error = 'User not found';
      this.loading = false;
      return;
    }

    const formValue = this.form.value;
    const appointmentDate = new Date(formValue.appointmentDate!);
    const payload = {
      patientId: parseInt(userId, 10),
      doctorId: parseInt(formValue.doctorId!, 10),
      appointmentDate: appointmentDate.toISOString(),
      notes: formValue.notes || '',
    };

    const apiBase = getApiBase();
    this.http.post(`${apiBase}/appointments`, payload).subscribe({
      next: () => {
        this.success = true;
        this.form.reset();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to request appointment';
        this.loading = false;
      },
    });
  }
}

