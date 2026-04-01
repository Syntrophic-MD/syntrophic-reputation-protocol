#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load fixed configuration
const config = require('../config-3min-fixed.json');

// Use the existing generate-3min-presentation.js with our fixed config
const originalConfigPath = path.join(__dirname, '..', 'config-3min.json');
const fixedConfigPath = path.join(__dirname, '..', 'config-3min-fixed.json');

// Backup original config
if (fs.existsSync(originalConfigPath)) {
  fs.copyFileSync(originalConfigPath, originalConfigPath + '.backup');
}

// Copy fixed config to main config location
fs.copyFileSync(fixedConfigPath, originalConfigPath);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Syntrophic 3-Minute FIXED Presentation Generator         ║');
console.log('║   Using Frank voice + aligned script from input folder     ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Key fixes:');
console.log('✓ Frank voice (lKf2tqVafNW1nVb7CgwC) instead of Adam');
console.log('✓ Voiceover segments properly spaced (no overlaps)');
console.log('✓ Script aligned with input/HACKATHON_3MIN_VOICEOVER_SCRIPT.md');
console.log('✓ Lower background music volume (0.08)');
console.log('✓ Proper timing gaps between segments');
console.log('');

try {
  // Run the main generator
  execSync('node generate-3min-presentation.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  // Rename output to indicate it's the fixed version
  const outputDir = path.join(__dirname, '..', 'output');
  const originalOutput = path.join(outputDir, 'syntrophic-3min-presentation.mp4');
  const fixedOutput = path.join(outputDir, 'syntrophic-3min-demo-fixed.mp4');
  
  if (fs.existsSync(originalOutput)) {
    fs.renameSync(originalOutput, fixedOutput);
    console.log(`\n✅ Fixed video saved as: ${fixedOutput}`);
  }
  
} catch (error) {
  console.error('Error generating video:', error.message);
} finally {
  // Restore original config
  if (fs.existsSync(originalConfigPath + '.backup')) {
    fs.copyFileSync(originalConfigPath + '.backup', originalConfigPath);
    fs.unlinkSync(originalConfigPath + '.backup');
  }
}