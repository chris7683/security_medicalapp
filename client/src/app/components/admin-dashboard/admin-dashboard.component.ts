import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { fadeIn, staggerList } from '../../animations';

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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatCardModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  animations: [fadeIn, staggerList]
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  patients: any[] = [];
  displayedColumns = ['id', 'username', 'email', 'role', 'actions'];
  showCreateForm = false;
  createForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['patient', [Validators.required]],
  });

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.loadUsers();
    this.loadPatients();
  }

  loadUsers() {
    console.log('Loading users from:', `${apiBase}/admin/users`);
    this.http.get<any[]>(`${apiBase}/admin/users`).subscribe({
      next: (data) => {
        console.log('Users loaded:', data?.length || 0, 'users');
        console.log('Users data:', data);
        this.users = data || [];
      },
      error: (err) => {
        console.error('Load users failed', err);
        console.error('Error details:', {
          status: err?.status,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/admin/users`
        });
        alert(`Failed to load users: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }

  loadPatients() {
    console.log('Loading patients from:', `${apiBase}/patients`);
    this.http.get<any[]>(`${apiBase}/patients`).subscribe({
      next: (data) => {
        console.log('Patients loaded:', data?.length || 0, 'patients');
        console.log('Patients data:', data);
        this.patients = data || [];
      },
      error: (err) => {
        console.error('Load patients failed', err);
        console.error('Error details:', {
          status: err?.status,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/patients`
        });
        alert(`Failed to load patients: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }

  createUser() {
    if (this.createForm.invalid) return;
    this.http.post(`${apiBase}/admin/users`, this.createForm.value).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.createForm.reset({ role: 'patient' });
        this.loadUsers();
        this.loadPatients();
      },
      error: (err) => alert(err?.error?.message || 'Failed to create user'),
    });
  }

  deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    this.http.delete(`${apiBase}/admin/users/${id}`).subscribe({
      next: () => {
        this.loadUsers();
        this.loadPatients();
      },
      error: (err) => alert(err?.error?.message || 'Failed to delete user'),
    });
  }

  assignDoctor(patientId: number, doctorId: number | string) {
    // If empty string or null, remove doctor assignment
    if (!doctorId || doctorId === '' || doctorId === 'null') {
      this.http.delete(`${apiBase}/admin/patients/${patientId}/doctor`).subscribe({
        next: () => {
          this.loadPatients();
          alert('Doctor assignment removed');
        },
        error: (err) => {
          console.error('Remove doctor error:', err);
          alert(err?.error?.message || 'Failed to remove doctor');
        },
      });
      return;
    }
    
    const doctorIdNum = typeof doctorId === 'string' ? parseInt(doctorId, 10) : doctorId;
    if (!doctorIdNum || isNaN(doctorIdNum)) {
      alert('Invalid doctor ID');
      return;
    }
    
    console.log(`Assigning doctor ${doctorIdNum} to patient ${patientId}`);
    this.http.post(`${apiBase}/admin/patients/${patientId}/assign-doctor`, { doctorId: doctorIdNum }).subscribe({
      next: () => {
        this.loadPatients();
        alert('Doctor assigned successfully');
      },
      error: (err) => {
        console.error('Assign doctor error:', err);
        const errorMessage = err?.error?.message || err?.message || 'Failed to assign doctor';
        alert(`Error: ${errorMessage}`);
      },
    });
  }

  assignNurse(patientId: number, nurseId: number | string) {
    // If empty string or null, remove nurse assignment
    if (!nurseId || nurseId === '' || nurseId === 'null') {
      this.http.delete(`${apiBase}/admin/patients/${patientId}/nurse`).subscribe({
        next: () => {
          this.loadPatients();
          alert('Nurse assignment removed');
        },
        error: (err) => alert(err?.error?.message || 'Failed to remove nurse'),
      });
      return;
    }
    
    const nurseIdNum = typeof nurseId === 'string' ? parseInt(nurseId, 10) : nurseId;
    if (!nurseIdNum || isNaN(nurseIdNum)) return;
    
    this.http.post(`${apiBase}/admin/patients/${patientId}/assign-nurse`, { nurseId: nurseIdNum }).subscribe({
      next: () => {
        this.loadPatients();
        alert('Nurse assigned successfully');
      },
      error: (err) => alert(err?.error?.message || 'Failed to assign nurse'),
    });
  }

  removeDoctor(patientId: number) {
    this.http.delete(`${apiBase}/admin/patients/${patientId}/doctor`).subscribe({
      next: () => this.loadPatients(),
      error: (err) => alert(err?.error?.message || 'Failed to remove doctor'),
    });
  }

  removeNurse(patientId: number) {
    this.http.delete(`${apiBase}/admin/patients/${patientId}/nurse`).subscribe({
      next: () => this.loadPatients(),
      error: (err) => alert(err?.error?.message || 'Failed to remove nurse'),
    });
  }

  getDoctors() {
    return this.users.filter((u) => u.role === 'doctor');
  }

  getNurses() {
    return this.users.filter((u) => u.role === 'nurse');
  }
}
