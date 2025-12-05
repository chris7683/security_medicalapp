import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { fadeIn } from '../../animations';

const apiBase = 'http://localhost:4000/api';

@Component({
  selector: 'app-weekly-medication-schedule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './weekly-medication-schedule.component.html',
  styleUrl: './weekly-medication-schedule.component.scss',
  animations: [fadeIn],
})
export class WeeklyMedicationScheduleComponent implements OnInit {
  patients: any[] = [];
  medications: string[] = [
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

  weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  form = this.fb.group({
    patientId: ['', [Validators.required]],
    medicationName: ['', [Validators.required]],
    dosage: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    instructions: [''],
    selectedDays: this.fb.group({
      monday: [false],
      tuesday: [false],
      wednesday: [false],
      thursday: [false],
      friday: [false],
      saturday: [false],
      sunday: [false],
    }),
    selectAllWeek: [false],
  });

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.loadPatients();
    
    // When "Select All Week" is checked, select all days
    this.form.get('selectAllWeek')?.valueChanges.subscribe((checked) => {
      if (checked) {
        const selectedDaysGroup = this.form.get('selectedDays') as FormGroup;
        const allDaysSelected: any = {};
        this.weekDays.forEach((day) => {
          allDaysSelected[day.value] = true;
        });
        selectedDaysGroup.patchValue(allDaysSelected);
      }
    });
  }

  loadPatients() {
    this.http.get<any[]>(`${apiBase}/patients`).subscribe({
      next: (data) => (this.patients = data),
      error: (err) => console.error('Load patients failed', err),
    });
  }

  submit() {
    if (this.form.invalid) return;
    
    const formValue = this.form.value;
    const selectedDaysGroup = this.form.get('selectedDays')?.value as any;
    const selectedDays = this.weekDays.filter((day) => selectedDaysGroup?.[day.value] === true);
    
    if (selectedDays.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    const patientId = parseInt(formValue.patientId as string, 10);
    const daysList = selectedDays.map(d => d.label).join(', ');
    const medicationData = {
      patientId,
      name: formValue.medicationName,
      dosage: formValue.dosage,
      frequency: formValue.frequency,
      instructions: formValue.instructions 
        ? `${formValue.instructions} (Scheduled for: ${daysList})`
        : `Scheduled for: ${daysList}`,
    };

    // Add medication for all selected days at once
    this.http.post(`${apiBase}/medications`, medicationData).subscribe({
      next: () => {
        alert(`Successfully added medication scheduled for: ${daysList}`);
        this.form.reset();
        // Reset select all week checkbox
        this.form.patchValue({ selectAllWeek: false });
      },
      error: (err) => {
        console.error('Failed to add medication', err);
        alert(err?.error?.message || 'Failed to add medication');
      },
    });
  }
}
