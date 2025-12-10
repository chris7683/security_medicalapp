import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PatientListComponent } from './components/patient-list/patient-list.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LogoutComponent } from './components/logout/logout.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { HomeComponent } from './components/home/home.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { MedicationFormComponent } from './components/medication-form/medication-form.component';
import { MedicationListComponent } from './components/medication-list/medication-list.component';
import { MedicationTrackingComponent } from './components/medication-tracking/medication-tracking.component';
import { TrackingViewComponent } from './components/tracking-view/tracking-view.component';
import { AppointmentRequestComponent } from './components/appointment-request/appointment-request.component';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { DiagnosisFormComponent } from './components/diagnosis-form/diagnosis-form.component';
import { DiagnosisViewComponent } from './components/diagnosis-view/diagnosis-view.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { AssignNurseComponent } from './components/assign-nurse/assign-nurse.component';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'patients', component: PatientListComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor', 'nurse'] } },
  { path: 'medications', component: MedicationFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor', 'nurse'] } },
  { path: 'prescriptions', component: MedicationListComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor', 'nurse'] } },
  { path: 'medication-tracking', component: MedicationTrackingComponent, canActivate: [authGuard, roleGuard], data: { roles: ['nurse'] } },
  { path: 'tracking-view', component: TrackingViewComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor'] } },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard, roleGuard], data: { roles: ['patient'] } },
  { path: 'appointment-request', component: AppointmentRequestComponent, canActivate: [authGuard, roleGuard], data: { roles: ['patient'] } },
  { path: 'appointments', component: AppointmentListComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor', 'patient'] } },
  { path: 'diagnosis/:id', component: DiagnosisFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor'] } },
  { path: 'diagnosis-view/:id', component: DiagnosisViewComponent, canActivate: [authGuard, roleGuard], data: { roles: ['patient'] } },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: 'assign-nurse', component: AssignNurseComponent, canActivate: [authGuard, roleGuard], data: { roles: ['doctor'] } },
  { path: 'logout', component: LogoutComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent },
];
