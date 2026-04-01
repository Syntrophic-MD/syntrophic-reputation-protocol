#!/usr/bin/env node
/**
 * 03-compose-video.js (v3.3)
 * 
 * Composes final video with full audio:
 * - Background music
 * - Voiceover  
 * - Sound effects (click, whoosh, chime)
 * - Singing (if enabled)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.v3.json'), 'utf8'));
const tempDir = path.join(__dirname, '..', 'temp');
const outputDir = path.join(__dirname, '..', 'output');
const assetsDir = path.join(__dirname, '..', 'assets');
const sfxDir = path.join(assetsDir, 'sfx');

fs.mkdirSync(outputDir, { recursive: true });

// Check for slides
const slidesManifestPath = path.join(tempDir, 'slides-manifest.json');
if (!fs.existsSync(slidesManifestPath)) {
  console.error('✗ Slides not found. Run 01-generate-slides.js first');
  process.exit(1);
}

// Check for demo - find most recent MP4
let demoVideo = null;
const mp4Files = fs.readdirSync(tempDir)
  .filter(f => f.endsWith('.mp4') && !f.includes('slide') && !f.includes('base') && !f.includes('final'))
  .map(f => ({ name: f, path: path.join(tempDir, f), mtime: fs.statSync(path.join(tempDir, f)).mtime }))
  .sort((a, b) => b.mtime - a.mtime);

if (mp4Files.length > 0) {
  demoVideo = mp4Files[0].path;
} else {
  // Check for webm
  const webmFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
  if (webmFiles.length > 0) {
    demoVideo = path.join(tempDir, webmFiles[0]);
  }
}

if (!demoVideo) {
  console.error('✗ Demo video not found. Run 02-record-demo.js first');
  process.exit(1);
}

const slidesManifest = JSON.parse(fs.readFileSync(slidesManifestPath, 'utf8'));
const openingSlide = slidesManifest.opening;
const closingSlide = slidesManifest.closing;
const outputVideo = path.join(outputDir, 'v3', 'syntrophic-demo-v3.mp4');

fs.mkdirSync(path.join(outputDir, 'v3'), { recursive: true });

// Audio files
const musicTrack = path.join(assetsDir, 'music.mp3');
const voiceoverTrack = path.join(assetsDir, 'voiceover.mp3');
const singingTrack = path.join(assetsDir, 'singing.mp3');
const clickSfx = path.join(sfxDir, 'click.mp3');
const whooshSfx = path.join(sfxDir, 'whoosh.mp3');
const chimeSfx = path.join(sfxDir, 'chime.mp3');

console.log('═══════════════════════════════════════');
console.log('  Video Composer v3.3 (FFmpeg)');
console.log('═══════════════════════════════════════\n');

// Verify files
const filesToCheck = [
  { path: openingSlide, name: 'Opening slide' },
  { path: closingSlide, name: 'Closing slide' },
  { path: demoVideo, name: 'Demo video' }
];

for (const file of filesToCheck) {
  if (!file.path || !fs.existsSync(file.path)) {
    console.error(`✗ ${file.name} not found: ${file.path}`);
    process.exit(1);
  }
  console.log(`✓ ${file.name}: ${path.basename(file.path)}`);
}

// Check audio
const hasMusic = fs.existsSync(musicTrack);
const hasVoiceover = fs.existsSync(voiceoverTrack);
const singingEnabled = config.audio.singing.enabled !== false;
const hasSinging = fs.existsSync(singingTrack) && singingEnabled;
const hasClick = fs.existsSync(clickSfx);
const hasWhoosh = fs.existsSync(whooshSfx);
const hasChime = fs.existsSync(chimeSfx);

console.log(`\nAudio:`);
console.log(`  ${hasMusic ? '✓' : '⊘'} Background music`);
console.log(`  ${hasVoiceover ? '✓' : '⊘'} Voiceover`);
console.log(`  ${hasSinging ? '✓' : '⊘'} Singing/jingle (${singingEnabled ? 'enabled' : 'disabled'})`);
console.log(`  ${hasClick ? '✓' : '⊘'} Click SFX`);
console.log(`  ${hasWhoosh ? '✓' : '⊘'} Whoosh SFX`);
console.log(`  ${hasChime ? '✓' : '⊘'} Chime SFX`);

// Get durations
function getDuration(file) {
  try {
    const result = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`, { encoding: 'utf8' });
    return parseFloat(result.trim());
  } catch (e) {
    return 0;
  }
}

console.log('\n▶ Analyzing video durations...');
const openingDuration = getDuration(openingSlide);
const closingDuration = getDuration(closingSlide);
const demoDuration = getDuration(demoVideo);
const targetDemoDuration = config.timing.demo_target || 19;

console.log(`  Opening: ${openingDuration.toFixed(2)}s`);
console.log(`  Demo (raw): ${demoDuration.toFixed(2)}s`);
console.log(`  Demo (target): ${targetDemoDuration}s`);
console.log(`  Closing: ${closingDuration.toFixed(2)}s`);

// Step 1: Convert and trim demo
let processedDemo = demoVideo;
const demoMp4 = demoVideo.replace('.webm', '.mp4');

if (demoVideo.endsWith('.webm') || demoDuration > targetDemoDuration) {
  console.log('\n▶ Processing demo...');
  processedDemo = demoMp4;
  
  try {
    if (demoDuration > targetDemoDuration) {
      console.log(`  Trimming to ${targetDemoDuration}s...`);
      execSync(`ffmpeg -y -i "${demoVideo}" -t ${targetDemoDuration} -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${processedDemo}"`, { stdio: 'pipe' });
    } else {
      console.log(`  Converting to MP4...`);
      execSync(`ffmpeg -y -i "${demoVideo}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${processedDemo}"`, { stdio: 'pipe' });
    }
    console.log(`  ✓ Demo processed`);
  } catch (e) {
    console.log(`  ⚠ Demo processing failed, using as-is`);
    processedDemo = demoVideo;
  }
}

// Step 2: Concatenate videos
console.log('\n▶ Concatenating videos...');

const concatList = path.join(tempDir, 'concat-list.txt');
fs.writeFileSync(concatList, [
  `file '${openingSlide}'`,
  `file '${processedDemo}'`,
  `file '${closingSlide}'`
].join('\n'));

const baseVideo = path.join(tempDir, 'base-video.mp4');

try {
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${baseVideo}"`, { stdio: 'pipe' });
  console.log(`  ✓ Base video created`);
} catch (error) {
  console.log(`  Re-encoding...`);
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:v libx264 -preset fast -crf 22 -c:a aac "${baseVideo}"`, { stdio: 'pipe' });
  console.log(`  ✓ Base video created (re-encoded)`);
}

const totalDuration = getDuration(baseVideo);
console.log(`  Total duration: ${totalDuration.toFixed(2)}s`);

// Step 3: Build audio track
console.log('\n▶ Building audio track...');

const audioInputs = [];
const audioFilters = [];
let inputIdx = 1; // 0 is video

// Background music
if (hasMusic) {
  audioInputs.push(`-i "${musicTrack}"`);
  const musicVolume = config.audio.music?.volume || 0.15;
  const fadeIn = config.audio.music?.fade_in || 2;
  const fadeOut = config.audio.music?.fade_out || 3;
  
  audioFilters.push(`[${inputIdx}:a]aloop=loop=-1:size=2e+09,atrim=duration=${totalDuration},volume=${musicVolume},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${(totalDuration - fadeOut).toFixed(2)}:d=${fadeOut}[music]`);
  inputIdx++;
}

// Voiceover
if (hasVoiceover) {
  audioInputs.push(`-i "${voiceoverTrack}"`);
  const voiceStart = config.timing?.voiceover_start || 0;
  const voiceVolume = config.audio.voiceover?.volume || 0.95;
  
  const voiceDelay = Math.floor(voiceStart * 1000);
  audioFilters.push(`[${inputIdx}:a]volume=${voiceVolume},adelay=${voiceDelay}|${voiceDelay}[voice]`);
  inputIdx++;
}

// Singing (only if enabled)
if (hasSinging && singingEnabled) {
  audioInputs.push(`-i "${singingTrack}"`);
  const singingStart = config.timing?.singing_start || 26;
  const singingVolume = config.audio.singing?.volume || 0.85;
  
  const singingDelay = Math.floor(singingStart * 1000);
  audioFilters.push(`[${inputIdx}:a]volume=${singingVolume},adelay=${singingDelay}|${singingDelay}[singing]`);
  inputIdx++;
}

// SFX - Click at demo start
if (hasClick) {
  audioInputs.push(`-i "${clickSfx}"`);
  const clickTime = openingDuration + 0.5;
  const clickDelay = Math.floor(clickTime * 1000);
  const clickVolume = config.audio.sfx?.click?.volume || 0.6;
  
  audioFilters.push(`[${inputIdx}:a]volume=${clickVolume},adelay=${clickDelay}|${clickDelay}[click]`);
  inputIdx++;
}

// SFX - Whoosh at transitions
if (hasWhoosh) {
  audioInputs.push(`-i "${whooshSfx}"`);
  audioInputs.push(`-i "${whooshSfx}"`);
  
  const whooshVolume = config.audio.sfx?.whoosh?.volume || 0.4;
  
  // First whoosh: opening -> demo
  const whoosh1Time = openingDuration - 0.3;
  const whoosh1Delay = Math.floor(Math.max(0, whoosh1Time) * 1000);
  audioFilters.push(`[${inputIdx}:a]volume=${whooshVolume},adelay=${whoosh1Delay}|${whoosh1Delay}[whoosh1]`);
  inputIdx++;
  
  // Second whoosh: demo -> closing
  const whoosh2Time = openingDuration + targetDemoDuration - 0.3;
  const whoosh2Delay = Math.floor(Math.max(0, whoosh2Time) * 1000);
  audioFilters.push(`[${inputIdx}:a]volume=${whooshVolume},adelay=${whoosh2Delay}|${whoosh2Delay}[whoosh2]`);
  inputIdx++;
}

// SFX - Chime at closing start
if (hasChime) {
  audioInputs.push(`-i "${chimeSfx}"`);
  const chimeTime = openingDuration + targetDemoDuration + 0.5;
  const chimeDelay = Math.floor(chimeTime * 1000);
  const chimeVolume = config.audio.sfx?.chime?.volume || 0.5;
  
  audioFilters.push(`[${inputIdx}:a]volume=${chimeVolume},adelay=${chimeDelay}|${chimeDelay}[chime]`);
  inputIdx++;
}

// Mix all audio
const mixInputs = [];
if (hasMusic) mixInputs.push('[music]');
if (hasVoiceover) mixInputs.push('[voice]');
if (hasSinging && singingEnabled) mixInputs.push('[singing]');
if (hasClick) mixInputs.push('[click]');
if (hasWhoosh) mixInputs.push('[whoosh1]', '[whoosh2]');
if (hasChime) mixInputs.push('[chime]');

let finalOutput = baseVideo;

if (mixInputs.length > 0) {
  console.log(`  Mixing ${mixInputs.length} audio sources...`);
  
  audioFilters.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=2[outa]`);
  
  const finalWithAudio = path.join(tempDir, 'final-with-audio.mp4');
  const cmd = `ffmpeg -y -i "${baseVideo}" ${audioInputs.join(' ')} -filter_complex "${audioFilters.join(';')}" -map 0:v -map "[outa]" -c:v copy -c:a aac -shortest "${finalWithAudio}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  ✓ Audio mixed`);
    finalOutput = finalWithAudio;
  } catch (error) {
    console.log(`  ✗ Audio mixing failed, using silent video`);
  }
}

// Step 4: Copy to output
console.log('\n▶ Finalizing output...');
fs.copyFileSync(finalOutput, outputVideo);

// Get final stats
const finalStats = fs.statSync(outputVideo);
const finalDuration = getDuration(outputVideo);

console.log(`  ✓ Output: ${outputVideo}`);
console.log(`  Duration: ${finalDuration.toFixed(1)}s`);
console.log(`  Size: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);

console.log('\n═══════════════════════════════════════');
console.log('  Video composition complete!');
console.log('═══════════════════════════════════════');
console.log(`\n  Output: ${outputVideo}`);
console.log(`  Duration: ${finalDuration.toFixed(1)}s`);
console.log(`  Resolution: ${config.quality.resolution}`);
console.log(`\n  Config: config.v3.json`);
console.log(`  Run again: node scripts/run-all.js\n`);