#!/usr/bin/env node
/**
 * run-all.js (v3)
 * 
 * Main orchestrator - runs the complete video production workflow.
 * 
 * Order:
 * 1. Generate audio (voiceover, music, SFX, singing)
 * 2. Generate slides
 * 3. Record demo
 * 4. Compose final video
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptsDir = __dirname;
const workflowDir = path.join(scriptsDir, '..');
const configPath = path.join(workflowDir, 'config.v3.json');

// Check config exists
if (!fs.existsSync(configPath)) {
  console.error('✗ config.v3.json not found');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       Syntrophic Video Production Workflow v3              ║');
console.log(`║       Target: ${config.project.duration_target}-second production-ready video             ║`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

const startTime = Date.now();

// Step 0: Generate audio
console.log('\n┌──────────────────────────────────────────┐');
console.log('│ STEP 0: Generate Audio Assets            │');
console.log('└──────────────────────────────────────────┘');
try {
  execSync(`node "${path.join(scriptsDir, '00-generate-audio.js')}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('✗ Audio generation failed (continuing with video)');
  console.error(error.message);
}

// Step 1: Generate slides
console.log('\n┌──────────────────────────────────────────┐');
console.log('│ STEP 1: Generate Opening/Closing Slides  │');
console.log('└──────────────────────────────────────────┘');
try {
  // Temporarily update slides script to use v3 config
  const slidesScript = path.join(scriptsDir, '01-generate-slides.js');
  let content = fs.readFileSync(slidesScript, 'utf8');
  content = content.replace(/config\.json/g, 'config.v3.json');
  fs.writeFileSync(slidesScript, content);
  
  execSync(`node "${slidesScript}"`, { stdio: 'inherit' });
  
  // Restore
  content = content.replace(/config\.v3\.json/g, 'config.json');
  fs.writeFileSync(slidesScript, content);
} catch (error) {
  console.error('✗ Slide generation failed');
  process.exit(1);
}

// Step 2: Record demo
console.log('\n┌──────────────────────────────────────────┐');
console.log('│ STEP 2: Record Website Demo              │');
console.log('└──────────────────────────────────────────┘');
try {
  execSync(`node "${path.join(scriptsDir, '02-record-demo.js')}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('✗ Demo recording failed');
  process.exit(1);
}

// Step 3: Compose final video
console.log('\n┌──────────────────────────────────────────┐');
console.log('│ STEP 3: Compose Final Video              │');
console.log('└──────────────────────────────────────────┘');
try {
  execSync(`node "${path.join(scriptsDir, '03-compose-video.js')}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('✗ Video composition failed');
  process.exit(1);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║             WORKFLOW COMPLETE ✓ (v3)                       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\n  Total time: ${elapsed}s`);
console.log(`  Output: ${path.join(workflowDir, 'output', config.project.output.split('/').pop())}`);
console.log('\n  Settings (config.v3.json):');
console.log(`    - Slides: ${config.slides.opening.duration}s + ${config.slides.closing.duration}s`);
console.log(`    - Demo: ${config.demo.target_duration}s target`);
console.log(`    - Music: ${config.audio.music.style}`);
console.log(`    - Voiceover: ${config.audio.voiceover.voice_name || 'ElevenLabs'}`);
console.log(`    - SFX: ${Object.keys(config.audio.sfx).filter(k => config.audio.sfx[k].enabled).length} effects`);
console.log(`    - Singing: ${config.audio.singing.enabled ? 'Yes' : 'No'}`);
console.log('\n  To customize:');
console.log('    1. Edit config.v3.json');
console.log('    2. Re-run: node scripts/run-all.js\n');