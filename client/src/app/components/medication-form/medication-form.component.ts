import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
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
  selector: 'app-medication-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatCardModule],
  templateUrl: './medication-form.component.html',
  styleUrl: './medication-form.component.scss',
  animations: [fadeIn]
})
export class MedicationFormComponent implements OnInit {
  patients: any[] = [];
  form = this.fb.group({
    patientId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    dosage: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    instructions: [''],
  });

  medications = [
    'Aspirin',
    'Ibuprofen',
    'Acetaminophen',
    'Amoxicillin',
    'Metformin',
    'Lisinopril',
    'Atorvastatin',
    'Levothyroxine',
    'Amlodipine',
    'Metoprolol',
    'Omeprazole',
    'Albuterol',
    'Gabapentin',
    'Sertraline',
    'Furosemide',
    'Simvastatin',
    'Hydrochlorothiazide',
    'Prednisone',
    'Tramadol',
    'Azithromycin',
    'Warfarin',
    'Doxycycline',
    'Losartan',
    'Carvedilol',
    'Fluoxetine',
    'Tamsulosin',
    'Pantoprazole',
    'Montelukast',
    'Cetirizine',
    'Loratadine'
  ];

  dosages = [
    '50mg',
    '100mg',
    '150mg',
    '200mg',
    '250mg',
    '300mg',
    '400mg',
    '500mg',
    '600mg',
    '800mg',
    '1000mg',
    '5mg',
    '10mg',
    '20mg',
    '25mg',
    '50mg/5ml',
    '125mg/5ml',
    '250mg/5ml',
    '500mg/5ml',
    '1mg',
    '2.5mg',
    '40mg',
    '80mg'
  ];

  frequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'Every morning',
    'Every evening',
    'As needed',
    'Once weekly',
    'Twice weekly',
    'With meals',
    'Before meals',
    'After meals',
    'At bedtime',
    'Every other day'
  ];

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    console.log('Loading patients from:', `${apiBase}/patients`);
    this.http.get<any[]>(`${apiBase}/patients`).subscribe({
      next: (data) => {
        console.log('Patients loaded:', data?.length || 0, 'patients');
        console.log('Patients data:', data);
        this.patients = data || [];
        if (this.patients.length === 0) {
          console.warn('No patients found. Make sure you have assigned patients.');
        }
      },
      error: (err) => {
        console.error('Load patients failed', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/patients`
        });
        alert(`Failed to load patients: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    const payload = { ...this.form.value, patientId: parseInt(this.form.value.patientId as string, 10) };
    this.http.post(`${apiBase}/medications`, payload).subscribe({
      next: () => {
        this.form.reset();
        alert('Medication added successfully');
      },
      error: (err) => alert(err?.error?.message || 'Failed to add medication'),
    });
  }
}
