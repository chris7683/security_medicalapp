# Testing Guide

## Prerequisites

1. **Run Database Migrations** (if not done already):
   ```bash
   psql -U postgres -d healthcare -f server/create_appointments_table.sql
   psql -U postgres -d healthcare -f server/create_diagnoses_table.sql
   psql -U postgres -d healthcare -f server/add_assigned_nurse_to_users.sql
   ```

2. **Ensure servers are running:**
   - Backend: http://localhost:4000
   - Frontend: http://localhost:4200

---

## Test Checklist by Role

### 🔐 **ADMIN Role Testing**

#### Test 1: Create Doctor
1. Login as admin (email: `admin@healthcare.com`, password: `Admin123!@#`)
2. Go to Admin Dashboard
3. Click "Create User"
4. Fill in:
   - Username: `DrSmith`
   - Email: `drsmith@healthcare.com`
   - Password: `password123` (min 8 chars)
   - Role: `Doctor`
5. Click "Create"
6. ✅ **Expected**: Doctor user created successfully

#### Test 2: Create Nurse
1. In Admin Dashboard, click "Create User"
2. Fill in:
   - Username: `NurseJane`
   - Email: `nursejane@healthcare.com`
   - Password: `password123`
   - Role: `Nurse`
3. Click "Create"
4. ✅ **Expected**: Nurse user created successfully

#### Test 3: Delete User
1. In Admin Dashboard, find a user
2. Click "Delete" button
3. Confirm deletion
4. ✅ **Expected**: User deleted successfully

---

### 👨‍⚕️ **DOCTOR Role Testing**

#### Test 4: Login as Doctor
1. Logout from admin
2. Login with doctor credentials (created in Test 1)
3. ✅ **Expected**: Successfully logged in, redirected to dashboard

#### Test 5: Assign Nurse to Doctor
1. Login as doctor
2. Click "Assign Nurse" in dashboard
3. Select a nurse from dropdown
4. Click "Assign Nurse"
5. ✅ **Expected**: Nurse assigned successfully, message shown

#### Test 6: View Appointments
1. As doctor, click "Appointments" in dashboard
2. ✅ **Expected**: See list of appointments (may be empty initially)

#### Test 7: Update Appointment Status
1. In appointments list, change status dropdown (pending → confirmed → completed)
2. ✅ **Expected**: Status updates successfully

#### Test 8: Write Diagnosis
1. As doctor, go to Appointments
2. Find a completed appointment (or complete one first)
3. Click "Write Diagnosis" button
4. Fill in:
   - Diagnosis: `Patient shows symptoms of common cold. Prescribed rest and fluids.`
   - Notes: `Follow up in 3 days if symptoms persist.`
5. Click "Save Diagnosis"
6. ✅ **Expected**: Diagnosis saved, redirected to appointments

#### Test 9: View Patients
1. Click "View Patients" in dashboard
2. ✅ **Expected**: See list of all patients

#### Test 10: Assign Nurse to Patient
1. Go to "View Patients"
2. Select a nurse from dropdown for a patient
3. ✅ **Expected**: Nurse assigned to patient

---

### 👩‍⚕️ **NURSE Role Testing**

#### Test 11: Login as Nurse
1. Logout, login with nurse credentials (created in Test 2)
2. ✅ **Expected**: Successfully logged in

#### Test 12: View Assigned Patients
1. As nurse, click "View Patients"
2. ✅ **Expected**: See only patients assigned to this nurse

#### Test 13: Write Medication
1. Click "Prescribe Medication"
2. Fill in medication details
3. ✅ **Expected**: Medication created successfully

---

### 👤 **PATIENT Role Testing**

#### Test 14: Patient Signup
1. Logout
2. Go to Signup page
3. Fill in:
   - Username: `patient1`
   - Email: `patient1@test.com`
   - Password: `password123` (min 8 chars)
   - Role: Should be fixed to "Patient" (no dropdown)
4. Click "Create account"
5. ✅ **Expected**: Account created, auto-logged in

#### Test 15: Request Appointment
1. As patient, click "Request Appointment"
2. Fill in:
   - Doctor: Select a doctor
   - Appointment Date: Choose a future date/time
   - Notes: `Regular checkup`
3. Click "Request Appointment"
4. ✅ **Expected**: Appointment requested successfully

#### Test 16: View Appointments
1. Click "Appointments" in dashboard
2. ✅ **Expected**: See list of your appointments

#### Test 17: View Diagnosis
1. As patient, go to Appointments
2. Find a completed appointment with diagnosis
3. Click "View" in Diagnosis column
4. ✅ **Expected**: See diagnosis details (diagnosis text, notes, doctor name, date)

#### Test 18: Change Password
1. Click "Change Password" in dashboard
2. Fill in:
   - Current Password: Your current password
   - New Password: `newpassword123`
   - Confirm Password: `newpassword123`
3. Click "Change Password"
4. ✅ **Expected**: Password changed successfully
5. Logout and login with new password to verify

#### Test 19: View Profile
1. Click "View Profile"
2. ✅ **Expected**: See patient profile information

---

## 🔍 **Edge Cases & Error Handling**

### Test 20: Patient Cannot Signup as Doctor/Nurse
1. Try to signup with role "Doctor" or "Nurse"
2. ✅ **Expected**: Error message: "Only patients can sign up"

### Test 21: Patient Cannot Request Appointment for Others
1. As patient, try to request appointment with different patientId
2. ✅ **Expected**: Error or request uses your own ID

### Test 22: Doctor Can Only Write Diagnosis for Own Appointments
1. As doctor, try to write diagnosis for appointment not assigned to you
2. ✅ **Expected**: Error: "You can only write diagnoses for your own appointments"

### Test 23: Patient Can Only View Own Diagnoses
1. As patient, try to access another patient's diagnosis
2. ✅ **Expected**: Error: "Forbidden"

### Test 24: Password Requirements
1. Try to change password with less than 8 characters
2. ✅ **Expected**: Validation error

### Test 25: Wrong Current Password
1. Try to change password with incorrect current password
2. ✅ **Expected**: Error: "Current password is incorrect"

---

## 📋 **Feature Verification Checklist**

### ✅ Appointment System
- [ ] Patients can request appointments
- [ ] Doctors can view all their appointments
- [ ] Doctors can update appointment status
- [ ] Doctors can delete appointments
- [ ] Patients can view their appointments
- [ ] Patients can delete pending appointments

### ✅ Diagnosis System
- [ ] Doctors can write diagnosis for completed appointments
- [ ] Patients can view their diagnoses
- [ ] Diagnosis links appointment to patient correctly
- [ ] Only one diagnosis per appointment

### ✅ Doctor-Nurse Association
- [ ] Doctors can assign nurses to themselves
- [ ] Assigned nurse shows in doctor's profile
- [ ] Nurses can be assigned to multiple doctors

### ✅ Password Management
- [ ] All users can change password
- [ ] Password validation (min 8 chars)
- [ ] Current password verification works
- [ ] New password confirmation works

### ✅ Role-Based Access
- [ ] Patients can only signup (not doctors/nurses)
- [ ] Only admin can create doctors/nurses
- [ ] Doctors can manage appointments
- [ ] Patients can view own data only

---

## 🐛 **Common Issues to Check**

1. **Database Tables Missing**
   - Error: "relation 'appointments' does not exist"
   - **Fix**: Run migration SQL files

2. **CORS Errors**
   - Check backend CORS configuration
   - Verify frontend origin matches

3. **Authentication Errors**
   - Check JWT token in localStorage
   - Verify token hasn't expired

4. **404 Errors on Routes**
   - Check Angular routes are properly configured
   - Verify component imports

---

## 📝 **Test Data Setup**

For easier testing, you can create test users via Admin Dashboard:

**Doctors:**
- Dr. Smith: `drsmith@healthcare.com` / `password123`
- Dr. Jones: `drjones@healthcare.com` / `password123`

**Nurses:**
- Nurse Jane: `nursejane@healthcare.com` / `password123`
- Nurse Bob: `nursebob@healthcare.com` / `password123`

**Patients:**
- Patient1: `patient1@test.com` / `password123`
- Patient2: `patient2@test.com` / `password123`

---

## 🎯 **Quick Test Flow**

1. **Admin**: Create 1 doctor, 1 nurse, 1 patient
2. **Patient**: Signup, request appointment, view appointments
3. **Doctor**: Login, assign nurse, view appointments, write diagnosis
4. **Patient**: View diagnosis, change password
5. **Nurse**: Login, view assigned patients, write medication

---

## 📊 **Success Criteria**

All features work correctly when:
- ✅ No console errors in browser
- ✅ No server errors in terminal
- ✅ Data persists in database
- ✅ Role-based access control works
- ✅ UI updates correctly after actions
- ✅ Error messages are clear and helpful

