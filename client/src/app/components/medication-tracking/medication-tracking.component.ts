import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
  selector: 'app-medication-tracking',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './medication-tracking.component.html',
  styleUrl: './medication-tracking.component.scss',
  animations: [fadeIn],
})
export class MedicationTrackingComponent implements OnInit {
  medications: any[] = [];
  displayedColumns = ['patient', 'medication', 'dosage', 'frequency', 'status', 'actions'];
  trackingStatus = 'pending';
  trackingNotes = '';

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadMedications();
  }

  loadMedications() {
    // Get medications for assigned patients
    const apiBase = getApiBase();
    console.log('Loading medications from:', `${apiBase}/medications`);
    this.http.get<any[]>(`${apiBase}/medications`).subscribe({
      next: (data) => {
        console.log('Medications loaded:', data);
        console.log('Number of medications:', data?.length || 0);
        this.medications = data || [];
        // Load tracking info for each medication
        this.medications.forEach((med) => {
          console.log('Loading tracking for medication:', med.id, med.name);
          this.http.get<any[]>(`${apiBase}/medication-tracking/medication/${med.id}`).subscribe({
            next: (trackings) => {
              if (trackings && trackings.length > 0) {
                // Get the most recent tracking
                med.tracking = trackings[0];
                console.log('Tracking found for medication', med.id, ':', med.tracking);
              } else {
                med.tracking = null;
              }
            },
            error: (err) => {
              // No tracking yet, that's okay
              console.log('No tracking found for medication', med.id, ':', err?.status);
              med.tracking = null;
            },
          });
        });
      },
      error: (err) => {
        console.error('Load medications failed', err);
        console.error('Error details:', {
          status: err?.status,
          message: err?.error?.message || err?.message,
        });
        this.medications = [];
      },
    });
  }

  trackMedication(medicationId: number, status: 'given' | 'missed' | 'pending', notes: string = '') {
    console.log('Tracking medication:', { medicationId, status, notes });
    
    // Validate medicationId
    if (!medicationId || isNaN(medicationId)) {
      alert('Invalid medication ID');
      console.error('Invalid medicationId:', medicationId);
      return;
    }

    const apiBase = getApiBase();
    this.http
      .post(`${apiBase}/medication-tracking/track`, {
        medicationId: parseInt(medicationId.toString(), 10),
        status,
        notes: notes || '',
      })
      .subscribe({
        next: (response) => {
          console.log('Medication tracked successfully:', response);
          alert('Medication tracked successfully');
          this.loadMedications();
        },
        error: (err) => {
          console.error('Failed to track medication:', err);
          console.error('Error details:', {
            status: err?.status,
            statusText: err?.statusText,
            message: err?.error?.message || err?.message,
            error: err?.error
          });
          alert(err?.error?.message || 'Failed to track medication. Please check the console for details.');
        },
      });
  }

  markAsGiven(medicationId: number) {
    console.log('Marking medication as given:', medicationId);
    // Try to get notes, but if prompt is blocked or cancelled, use empty string
    let notes = '';
    try {
      const userInput = prompt('Enter tracking notes (optional):');
      notes = userInput || '';
    } catch (e) {
      console.log('Prompt blocked or cancelled, using empty notes');
      notes = '';
    }
    this.trackMedication(medicationId, 'given', notes);
  }

  markAsMissed(medicationId: number) {
    console.log('Marking medication as missed:', medicationId);
    // Try to get notes, but if prompt is blocked or cancelled, use empty string
    let notes = '';
    try {
      const userInput = prompt('Enter tracking notes (optional):');
      notes = userInput || '';
    } catch (e) {
      console.log('Prompt blocked or cancelled, using empty notes');
      notes = '';
    }
    this.trackMedication(medicationId, 'missed', notes);
  }
}
