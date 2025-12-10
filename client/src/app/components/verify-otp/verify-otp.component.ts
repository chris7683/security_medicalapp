import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { fadeIn } from '../../animations';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss',
  animations: [fadeIn]
})
export class VerifyOtpComponent implements OnInit {
  form = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  loading = false;
  error: string | null = null;
  email: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Get email from localStorage (set during login)
    this.email = localStorage.getItem('pendingLoginEmail');
    if (!this.email) {
      // If no email found, redirect back to login
      this.router.navigateByUrl('/login');
    }
  }

  onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Remove non-digits
    this.form.patchValue({ otp: value }, { emitEvent: false });
    // Update the input value to reflect the filtered value
    if (input.value !== value) {
      input.value = value;
    }
  }

  submit() {
    if (this.form.invalid || !this.email) return;
    this.loading = true;
    this.error = null;
    
    this.auth.verifyLoginOTP({ email: this.email, otp: this.form.value.otp! }).subscribe({
      next: () => {
        // Clear pending email
        localStorage.removeItem('pendingLoginEmail');
        // Navigate to dashboard
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        console.error('OTP verification error', err);
        this.error = err?.error?.message || err?.message || 'Invalid or expired code. Please try again.';
        this.loading = false;
      },
    });
  }

  resendOTP() {
    // Redirect back to login to resend OTP
    this.router.navigateByUrl('/login');
  }
}

