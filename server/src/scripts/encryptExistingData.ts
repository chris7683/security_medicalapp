import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import '../models'; // Import models to initialize them
import { Patient } from '../models/Patient';
import { Medication } from '../models/Medication';
import { MedicationTracking } from '../models/MedicationTracking';
import { encrypt, isEncrypted } from '../utils/encryption';

dotenv.config();

async function encryptExistingData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Encrypt Patient data
    console.log('\n📋 Encrypting Patient data...');
    const patients = await Patient.findAll({ raw: true });
    let patientCount = 0;
    
    for (const patient of patients) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Check and encrypt name
      if (patient.name && !isEncrypted(patient.name)) {
        const encrypted = encrypt(patient.name);
        if (encrypted) {
          updates.name = encrypted;
          needsUpdate = true;
        }
      }
      
      // Check and encrypt condition
      if (patient.condition && !isEncrypted(patient.condition)) {
        const encrypted = encrypt(patient.condition);
        if (encrypted) {
          updates.condition = encrypted;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await Patient.update(updates, { where: { id: patient.id } });
        patientCount++;
        console.log(`  ✓ Encrypted patient ID ${patient.id}`);
      }
    }
    console.log(`✅ Encrypted ${patientCount} patient records`);

    // Encrypt Medication data
    console.log('\n💊 Encrypting Medication data...');
    const medications = await Medication.findAll({ raw: true });
    let medicationCount = 0;
    
    for (const medication of medications) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Check and encrypt name
      if (medication.name && !isEncrypted(medication.name)) {
        const encrypted = encrypt(medication.name);
        if (encrypted) {
          updates.name = encrypted;
          needsUpdate = true;
        }
      }
      
      // Check and encrypt dosage
      if (medication.dosage && !isEncrypted(medication.dosage)) {
        const encrypted = encrypt(medication.dosage);
        if (encrypted) {
          updates.dosage = encrypted;
          needsUpdate = true;
        }
      }
      
      // Check and encrypt instructions
      if (medication.instructions && !isEncrypted(medication.instructions)) {
        const encrypted = encrypt(medication.instructions);
        if (encrypted) {
          updates.instructions = encrypted;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await Medication.update(updates, { where: { id: medication.id } });
        medicationCount++;
        console.log(`  ✓ Encrypted medication ID ${medication.id}`);
      }
    }
    console.log(`✅ Encrypted ${medicationCount} medication records`);

    // Encrypt MedicationTracking data
    console.log('\n📝 Encrypting MedicationTracking data...');
    const trackings = await MedicationTracking.findAll({ raw: true });
    let trackingCount = 0;
    
    for (const tracking of trackings) {
      if (tracking.notes && !isEncrypted(tracking.notes)) {
        const encrypted = encrypt(tracking.notes);
        if (encrypted) {
          await MedicationTracking.update(
            { notes: encrypted },
            { where: { id: tracking.id } }
          );
          trackingCount++;
          console.log(`  ✓ Encrypted tracking ID ${tracking.id}`);
        }
      }
    }
    console.log(`✅ Encrypted ${trackingCount} tracking records`);

    console.log('\n✅ Data encryption complete!');
    console.log(`   - Patients: ${patientCount} encrypted`);
    console.log(`   - Medications: ${medicationCount} encrypted`);
    console.log(`   - Tracking records: ${trackingCount} encrypted`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    process.exit(1);
  }
}

encryptExistingData();

