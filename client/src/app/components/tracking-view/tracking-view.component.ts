import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
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
  selector: 'app-tracking-view',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule],
  templateUrl: './tracking-view.component.html',
  styleUrl: './tracking-view.component.scss',
  animations: [fadeIn],
})
export class TrackingViewComponent implements OnInit {
  trackings: any[] = [];
  displayedColumns = ['patient', 'medication', 'dosage', 'status', 'trackedBy', 'trackedAt', 'notes'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTracking();
  }

  loadTracking() {
    console.log('Loading tracking from:', `${apiBase}/medication-tracking/all`);
    this.http.get<any[]>(`${apiBase}/medication-tracking/all`).subscribe({
      next: (data) => {
        console.log('Tracking loaded:', data?.length || 0, 'records');
        console.log('Tracking data:', data);
        this.trackings = data || [];
      },
      error: (err) => {
        console.error('Load tracking failed', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.error?.message || err?.message,
          url: `${apiBase}/medication-tracking/all`
        });
        alert(`Failed to load tracking: ${err?.error?.message || err?.message || 'Unknown error'}. Check console for details.`);
      },
    });
  }
}
