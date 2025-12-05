import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { fadeIn } from '../../animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [fadeIn]
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['', [Validators.required]],
  });

  loading = false;
  error: string | null = null;
  roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'patient', label: 'Patient' },
  ];

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.auth.login(this.form.value as any).subscribe({
      next: (res: any) => {
        const selected = this.form.value.role;
        const actual = res?.user?.role;
        if (selected && actual && selected !== actual) {
          this.error = 'Selected role does not match your account role.';
          this.loading = false;
          return;
        }
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        console.error('Login error', err);
        this.error = err?.error?.message || err?.message || `Login failed (status ${err?.status ?? 'unknown'})`;
        this.loading = false;
      },
    });
  }
}
