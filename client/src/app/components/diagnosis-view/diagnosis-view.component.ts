import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { fadeIn } from '../../animations';

const apiBase = 'http://localhost:4000/api';

@Component({
  selector: 'app-diagnosis-view',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './diagnosis-view.component.html',
  styleUrl: './diagnosis-view.component.scss',
  animations: [fadeIn]
})
export class DiagnosisViewComponent implements OnInit {
  diagnosis: any = null;
  loading = false;
  error: string | null = null;
  appointmentId: number | null = null;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appointmentId = parseInt(id, 10);
      this.loadDiagnosis();
    }
  }

  loadDiagnosis() {
    if (!this.appointmentId) return;
    this.loading = true;
    this.http.get<any>(`${apiBase}/diagnoses/appointment/${this.appointmentId}`).subscribe({
      next: (data) => {
        this.diagnosis = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load diagnosis';
        this.loading = false;
      },
    });
  }
}

