
/**
 * @fileOverview Interactive Installer Script for LexiVerse Explorer.
 * Helps scholars configure their environment by prompting for API and Analytics keys.
 */

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', prompt: 'Enter Firebase API Key: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', prompt: 'Enter Firebase Auth Domain: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', prompt: 'Enter Firebase Project ID: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', prompt: 'Enter Firebase Storage Bucket: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', prompt: 'Enter Firebase Messaging Sender ID: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', prompt: 'Enter Firebase App ID: ' },
  { key: 'GEMINI_API_KEY', prompt: 'Enter Gemini AI API Key (from Google AI Studio): ' },
  { key: 'NEXT_PUBLIC_GA_MEASUREMENT_ID', prompt: 'Enter Google Analytics (GA4) Measurement ID (optional): ' },
  { key: 'NEXT_PUBLIC_MATOMO_SITE_ID', prompt: 'Enter Matomo Site ID (optional): ' },
  { key: 'NEXT_PUBLIC_MATOMO_URL', prompt: 'Enter Matomo URL (e.g., https://your-matomo.com) (optional): ' },
];

async function runSetup() {
  console.log('\n==========================================');
  console.log('      LEXIVERSE EXPLORER INSTALLER       ');
  console.log('==========================================\n');
  console.log('This script will configure your scholarly environment.\n');

  let envContent = '';

  for (const q of questions) {
    const answer = await new Promise(resolve => rl.question(q.prompt, resolve));
    if (answer.trim()) {
      envContent += `${q.key}=${answer.trim()}\n`;
    }
  }

  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n[Success] .env file has been created/updated.');
    console.log('Your scholarly environment is now configured.\n');
  } catch (error) {
    console.error('\n[Error] Failed to write .env file:', error.message);
  }

  rl.close();
}

runSetup();
