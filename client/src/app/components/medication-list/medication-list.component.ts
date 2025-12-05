import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
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
  selector: 'app-medication-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule],
  templateUrl: './medication-list.component.html',
  styleUrl: './medication-list.component.scss',
  animations: [fadeIn]
})
export class MedicationListComponent implements OnInit {
  medications: any[] = [];
  displayedColumns: string[] = [];
  userRole: string | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    // Get user role to determine which columns to show
    this.auth.currentUser$.subscribe(user => {
      this.userRole = user?.role || null;
      this.updateDisplayColumns();
    });
    this.loadMedications();
  }

  updateDisplayColumns() {
    if (this.userRole === 'doctor' || this.userRole === 'nurse') {
      this.displayedColumns = ['patient', 'name', 'dosage', 'frequency', 'instructions', 'actions'];
    } else {
      this.displayedColumns = ['name', 'dosage', 'frequency', 'instructions'];
    }
  }

  loadMedications() {
    console.log('Loading medications from:', `${apiBase}/medications`);
    console.log('Current user role:', this.userRole);
    this.http.get<any[]>(`${apiBase}/medications`).subscribe({
      next: (data) => {
        console.log('Medications loaded:', data?.length || 0, 'medications');
        console.log('Medications data:', data);
        this.medications = data || [];
        // Update columns after data loads in case role wasn't available yet
        if (!this.userRole) {
          this.auth.currentUser$.subscribe(user => {
            this.userRole = user?.role || null;
            this.updateDisplayColumns();
          });
        }
      },
      error: (err) => {
        console.error('Load medications failed', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/medications`
        });
        this.medications = [];
        alert(`Failed to load medications: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }

  getPatientName(medication: any): string {
    return medication.Patient?.name || medication.patient?.name || 'Unknown Patient';
  }

  canDelete(medication: any): boolean {
    return this.userRole === 'doctor';
  }

  deleteMedication(id: number) {
    if (!confirm('Are you sure you want to delete this medication?')) return;
    this.http.delete(`${apiBase}/medications/${id}`).subscribe({
      next: () => {
        this.loadMedications();
        alert('Medication deleted successfully');
      },
      error: (err) => {
        console.error('Delete medication failed', err);
        alert(err?.error?.message || 'Failed to delete medication');
      },
    });
  }
}
