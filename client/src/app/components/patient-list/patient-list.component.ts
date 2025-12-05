import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, map, forkJoin } from 'rxjs';
import { fadeIn } from '../../animations';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
  animations: [fadeIn]
})
export class PatientListComponent implements OnInit {
  // API base URL - automatically uses HTTPS if available
  get apiBase(): string {
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
  }
  displayedColumns: string[] = ['name', 'age', 'condition'];
  patients: any[] = [];
  nurses: any[] = [];
  userRole: string = '';
  loading = false;
  nursesLoading = false;
  nursesLoaded = false;
  editingCondition: { [key: number]: boolean } = {};
  conditionValues: { [key: number]: string } = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userRole = user.role;
        if (user.role === 'doctor') {
          this.displayedColumns = ['name', 'age', 'condition', 'nurse'];
          // Only load nurses once
          if (!this.nursesLoaded && !this.nursesLoading) {
            this.loadNurses();
          }
        } else if (user.role === 'nurse') {
          // Nurses can see patients but not conditions
          this.displayedColumns = ['name', 'age'];
        } else {
          this.displayedColumns = ['name', 'age', 'condition'];
        }
      }
    });
    this.loadPatients();
  }

  loadPatients() {
    console.log('Loading patients from:', `${this.apiBase}/patients`);
    console.log('Current user role:', this.userRole);
    this.http.get<any[]>(`${this.apiBase}/patients`).subscribe({
      next: (patients) => {
        console.log('Patients loaded:', patients?.length || 0, 'patients');
        console.log('Patients data:', patients);
        this.patients = patients || [];
        // Initialize condition values for editing (only for doctors)
        if (this.userRole === 'doctor') {
          patients?.forEach((p: any) => {
            this.conditionValues[p.id] = p.condition || '';
          });
          // Load nurses if not already loaded
          if (!this.nursesLoaded && !this.nursesLoading) {
            this.loadNurses();
          }
        }
      },
      error: (err) => {
        console.error('Failed to load patients', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          url: `${this.apiBase}/patients`
        });
        this.patients = [];
        alert(`Failed to load patients: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }

  loadNurses() {
    // Allow retry if there was a previous error (nursesLoaded will be false)
    if (this.nursesLoading) {
      console.log('Nurses already loading, skipping duplicate request...');
      return;
    }

    this.nursesLoading = true;
    console.log('Loading nurses from:', `${this.apiBase}/users/nurses`);
    
    this.http.get<any[]>(`${this.apiBase}/users/nurses`).subscribe({
      next: (response) => {
        this.nursesLoading = false;
        this.nursesLoaded = true;
        
        console.log('Raw response from API:', response);
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));
        
        // Handle different response formats
        let nurses = response;
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // If response is an object, check for common data properties
          nurses = (response as any).data || (response as any).nurses || (response as any).users || [];
        }
        
        this.nurses = Array.isArray(nurses) ? nurses : [];
        console.log('Processed nurses array:', this.nurses);
        console.log('Number of nurses:', this.nurses.length);
        
        // Ensure all nurse IDs are properly formatted
        this.nurses = this.nurses.map(n => ({
          ...n,
          id: n.id ? parseInt(n.id.toString(), 10) : null
        })).filter(n => n.id !== null && !isNaN(n.id));
        
        console.log('Final nurses array after processing:', this.nurses);
        
        if (this.nurses.length === 0) {
          console.warn('No nurses found in the system. Response was:', response);
        } else {
          console.log('Nurses available for dropdown:', this.nurses.map(n => ({ 
            id: n.id, 
            username: n.username,
            email: n.email,
            role: n.role 
          })));
        }
      },
      error: (err) => {
        this.nursesLoading = false;
        // Don't set nursesLoaded to true on error, so we can retry
        console.error('Failed to load nurses', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          error: err?.error,
          url: `${this.apiBase}/users/nurses`
        });
        
        // Handle rate limiting specifically
        if (err?.status === 429) {
          const retryAfter = err?.headers?.get('Retry-After') || 60;
          console.warn(`Rate limited. Please wait ${retryAfter} seconds before trying again.`);
          alert(`Too many requests. Please wait a moment and refresh the page.`);
        } else {
          // Show user-friendly error message for other errors
          const errorMsg = err?.error?.message || err?.message || 'Unknown error';
          console.error(`Failed to load nurses: ${errorMsg}`);
          alert(`Failed to load nurses: ${errorMsg}. Status: ${err?.status || 'unknown'}. Please check the console for details.`);
        }
        this.nurses = [];
      },
    });
  }

  getNurseName(nurseId: number | string | null | undefined): string {
    if (!nurseId) return 'None';
    const nurseIdNum = typeof nurseId === 'string' ? parseInt(nurseId, 10) : nurseId;
    const nurse = this.nurses.find((n) => {
      const nId = typeof n.id === 'string' ? parseInt(n.id, 10) : n.id;
      return nId === nurseIdNum;
    });
    return nurse ? nurse.username : 'Unknown';
  }

  assignNurse(patientId: number | string, nurseId: string | number | null) {
    const patientIdNum = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
    
    // Handle empty string or null as removing assignment
    if (!nurseId || nurseId === '' || nurseId === 'null') {
      this.http.post(`${this.apiBase}/users/${patientIdNum}/assign-nurse`, { nurseId: null }).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (err) => {
          console.error('Error removing nurse assignment:', err);
          alert(err?.error?.message || 'Failed to remove nurse assignment');
        },
      });
      return;
    }

    const nurseIdNum = typeof nurseId === 'string' ? parseInt(nurseId, 10) : nurseId;
    if (isNaN(nurseIdNum)) {
      alert('Invalid nurse ID');
      return;
    }

    this.http.post(`${this.apiBase}/users/${patientIdNum}/assign-nurse`, { nurseId: nurseIdNum }).subscribe({
      next: () => {
        this.loadPatients();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to assign nurse');
      },
    });
  }

  startEditingCondition(patientId: number) {
    this.editingCondition[patientId] = true;
    if (!this.conditionValues[patientId]) {
      this.conditionValues[patientId] = '';
    }
  }

  cancelEditingCondition(patientId: number) {
    this.editingCondition[patientId] = false;
    // Reset to original value
    const patient = this.patients.find((p: any) => p.id === patientId);
    if (patient) {
      this.conditionValues[patientId] = patient.condition || '';
    }
  }

  saveCondition(patientId: number) {
    const condition = this.conditionValues[patientId]?.trim() || '';
    const patientIdStr = patientId.toString();
    
    this.http.put(`${this.apiBase}/patients/${patientIdStr}`, { condition }).subscribe({
      next: () => {
        this.editingCondition[patientId] = false;
        this.loadPatients();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to update condition');
        console.error('Error updating condition:', err);
      },
    });
  }

  deleteCondition(patientId: number) {
    if (confirm('Are you sure you want to delete this condition?')) {
      const patientIdStr = patientId.toString();
      this.http.put(`${this.apiBase}/patients/${patientIdStr}`, { condition: '' }).subscribe({
        next: () => {
          this.editingCondition[patientId] = false;
          this.conditionValues[patientId] = '';
          this.loadPatients();
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to delete condition');
          console.error('Error deleting condition:', err);
        },
      });
    }
  }

  isEditingCondition(patientId: number): boolean {
    return this.editingCondition[patientId] === true;
  }
}
