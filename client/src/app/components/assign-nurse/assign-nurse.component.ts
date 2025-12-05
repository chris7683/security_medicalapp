import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
  selector: 'app-assign-nurse',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './assign-nurse.component.html',
  styleUrl: './assign-nurse.component.scss',
  animations: [fadeIn]
})
export class AssignNurseComponent implements OnInit {
  form = this.fb.group({
    nurseId: ['', [Validators.required]],
  });

  nurses: any[] = [];
  currentNurse: any = null;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    // Load nurses first, then current nurse will be loaded after nurses are available
    this.loadNurses();
  }

  loadNurses() {
    this.http.get<any[]>(`${getApiBase()}/users/nurses`).subscribe({
      next: (nurses) => {
        this.nurses = Array.isArray(nurses) ? nurses : [];
        // After loading nurses, try to load current nurse
        this.loadCurrentNurse();
      },
      error: (err) => {
        console.error('Failed to load nurses', err);
        this.error = err?.error?.message || 'Failed to load nurses';
      },
    });
  }

  loadCurrentNurse() {
    // Get current user from localStorage (already available after login)
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      console.warn('No current user found in localStorage');
      return;
    }

    try {
      const currentUser = JSON.parse(userStr);
      
      // Check if user has an assigned nurse
      if (currentUser.assignedNurseId) {
        // Find the nurse from the nurses list we already loaded
        const nurseId = typeof currentUser.assignedNurseId === 'string' 
          ? parseInt(currentUser.assignedNurseId, 10) 
          : currentUser.assignedNurseId;
        
        const nurse = this.nurses.find((n: any) => {
          const nId = typeof n.id === 'string' ? parseInt(n.id, 10) : n.id;
          return nId === nurseId;
        });
        
        if (nurse) {
          this.currentNurse = nurse;
          this.form.patchValue({ nurseId: nurse.id.toString() });
        } else {
          // If nurse not found in list, we might need to fetch it separately
          // But for now, we'll just show that a nurse is assigned but we don't have details
          console.warn('Assigned nurse not found in nurses list');
        }
      }
    } catch (e) {
      console.error('Error parsing current user:', e);
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.success = false;

    const payload = {
      nurseId: parseInt(this.form.value.nurseId!, 10),
    };

    this.http.post<any>(`${getApiBase()}/users/assign-nurse`, payload).subscribe({
      next: (response) => {
        this.success = true;
        this.loading = false;
        
        // Update localStorage with updated doctor info from response
        if (response?.doctor) {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            try {
              const currentUser = JSON.parse(userStr);
              // Update with the doctor object from response
              currentUser.assignedNurseId = response.doctor.assignedNurseId;
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } catch (e) {
              console.error('Error updating localStorage:', e);
            }
          }
        } else {
          // Fallback: just update with the nurseId we sent
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            try {
              const currentUser = JSON.parse(userStr);
              currentUser.assignedNurseId = payload.nurseId;
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } catch (e) {
              console.error('Error updating localStorage:', e);
            }
          }
        }
        
        // Reload current nurse to update the display
        this.loadCurrentNurse();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to assign nurse';
        this.loading = false;
      },
    });
  }
}

