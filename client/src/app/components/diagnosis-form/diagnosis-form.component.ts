import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { fadeIn } from '../../animations';

const apiBase = 'http://localhost:4000/api';

@Component({
  selector: 'app-diagnosis-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './diagnosis-form.component.html',
  styleUrl: './diagnosis-form.component.scss',
  animations: [fadeIn]
})
export class DiagnosisFormComponent implements OnInit {
  form = this.fb.group({
    diagnosis: ['', [Validators.required, Validators.minLength(1)]],
    notes: [''],
  });

  appointmentId: number | null = null;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appointmentId = parseInt(id, 10);
    }
  }

  submit() {
    if (this.form.invalid || !this.appointmentId) return;
    this.loading = true;
    this.error = null;
    this.success = false;

    const payload = {
      appointmentId: this.appointmentId,
      diagnosis: this.form.value.diagnosis,
      notes: this.form.value.notes || '',
    };

    this.http.post(`${apiBase}/diagnoses`, payload).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/appointments']);
        }, 2000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to create diagnosis';
        this.loading = false;
      },
    });
  }
}

