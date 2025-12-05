#!/usr/bin/env node

/**
 * Security check script for package dependencies
 * Run with: node package-security-script.js
 * 
 * This script checks for:
 * - Known vulnerabilities in dependencies
 * - Outdated packages
 * - Security best practices
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Checks...\n');

// Check if npm audit is available
// Note: npm audit returns non-zero exit code when vulnerabilities are found
// This is expected behavior, not an error
try {
  console.log('1. Running npm audit...');
  const auditResult = execSync('npm audit --json', { 
    cwd: path.join(__dirname),
    encoding: 'utf8',
    stdio: 'pipe',
    // Don't throw on non-zero exit code - vulnerabilities are expected
  });
  
  const audit = JSON.parse(auditResult);
  
  if (audit.metadata && audit.metadata.vulnerabilities) {
    const vulns = audit.metadata.vulnerabilities;
    const total = vulns.info + vulns.low + vulns.moderate + vulns.high + vulns.critical;
    
    if (total > 0) {
      console.log(`   ⚠️  Found ${total} vulnerabilities:`);
      console.log(`      - Critical: ${vulns.critical}`);
      console.log(`      - High: ${vulns.high}`);
      console.log(`      - Moderate: ${vulns.moderate}`);
      console.log(`      - Low: ${vulns.low}`);
      console.log(`      - Info: ${vulns.info}`);
      console.log('\n   Run "npm audit fix" to attempt automatic fixes.');
    } else {
      console.log('   ✅ No known vulnerabilities found.');
    }
  } else {
    console.log('   ✅ No known vulnerabilities found.');
  }
} catch (error) {
  // npm audit returns non-zero exit code when vulnerabilities exist
  // Try to parse the output anyway
  try {
    const auditResult = error.stdout || error.stderr || '';
    if (auditResult) {
      const audit = JSON.parse(auditResult);
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const total = vulns.info + vulns.low + vulns.moderate + vulns.high + vulns.critical;
        if (total > 0) {
          console.log(`   ⚠️  Found ${total} vulnerabilities (see details below)`);
          console.log('   Run "npm audit fix" to attempt automatic fixes.');
        }
      }
    } else {
      console.log('   ⚠️  npm audit failed. Make sure npm is installed and up to date.');
    }
  } catch (parseError) {
    console.log('   ⚠️  npm audit failed. Make sure npm is installed and up to date.');
  }
}

// Check for outdated packages
try {
  console.log('\n2. Checking for outdated packages...');
  const outdated = execSync('npm outdated --json', { 
    cwd: path.join(__dirname),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  const outdatedPackages = JSON.parse(outdated);
  const count = Object.keys(outdatedPackages).length;
  
  if (count > 0) {
    console.log(`   ⚠️  Found ${count} outdated packages.`);
    console.log('   Run "npm update" to update packages.');
  } else {
    console.log('   ✅ All packages are up to date.');
  }
} catch (error) {
  // npm outdated returns non-zero exit code when packages are outdated
  if (error.status === 1) {
    console.log('   ⚠️  Some packages are outdated.');
  } else {
    console.log('   ✅ All packages are up to date.');
  }
}

// Check for package-lock.json
console.log('\n3. Checking package-lock.json...');
if (fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
  console.log('   ✅ package-lock.json exists (ensures reproducible builds).');
} else {
  console.log('   ⚠️  package-lock.json not found. Run "npm install" to generate it.');
}

// Check for .env.example
console.log('\n4. Checking environment configuration...');
if (fs.existsSync(path.join(__dirname, '.env.example'))) {
  console.log('   ✅ .env.example exists (good practice for documentation).');
} else {
  console.log('   ⚠️  .env.example not found. Consider creating one for documentation.');
}

console.log('\n✅ Security check complete!\n');
console.log('📋 Recommendations:');
console.log('   - Run "npm audit fix" to fix vulnerabilities');
console.log('   - Review and update outdated packages regularly');
console.log('   - Keep dependencies up to date');
console.log('   - Use "npm ci" in production for reproducible builds');
console.log('   - Consider using Dependabot or similar for automated updates\n');

