#!/usr/bin/env node
/**
 * 00-generate-audio.js (v3.1)
 * 
 * Generates all audio assets:
 * - Background music (downloaded from Pixabay)
 * - Voiceover (ElevenLabs)
 * - Sound effects (FFmpeg synthesized)
 * - Singing ending (ElevenLabs)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.v3.json'), 'utf8'));
const assetsDir = path.join(__dirname, '..', 'assets');
const sfxDir = path.join(assetsDir, 'sfx');

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(sfxDir, { recursive: true });

const ELEVENLABS_API_KEY = execSync(`security find-generic-password -a 'friendlyagent222@gmail.com' -s '11 Labs API Key' -w`, { encoding: 'utf8' }).trim();

console.log('═══════════════════════════════════════');
console.log('  Audio Generator (v3.1)');
console.log('═══════════════════════════════════════\n');

/**
 * Generate voiceover with ElevenLabs
 */
async function generateVoiceover() {
  console.log('▶ Generating voiceover...');
  const { text, voice_id, model, output_file, voice_name } = config.audio.voiceover;
  
  console.log(`  Voice: ${voice_name} (${voice_id})`);
  console.log(`  Text: "${text.substring(0, 50)}..."`);

  const payload = JSON.stringify({
    text: text,
    model_id: model,
    voice_settings: {
      stability: 0.35,
      similarity_boost: 0.75,
      style: 0.4,
      use_speaker_boost: true
    }
  });

  const outputPath = path.join(assetsDir, 'voiceover.mp3');
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voice_id}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`  ✗ Voiceover failed: ${res.statusCode} ${body}`);
          reject(new Error(`ElevenLabs API error: ${res.statusCode}`));
        });
        return;
      }
      
      const file = fs.createWriteStream(outputPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(outputPath);
        console.log(`  ✓ Voiceover: ${outputPath} (${(stat.size/1024).toFixed(1)} KB)`);
        resolve(outputPath);
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Generate singing/jingle with ElevenLabs
 */
async function generateSinging() {
  console.log('\n▶ Generating singing jingle...');
  const { text, voice_id, voice_name } = config.audio.singing;
  
  console.log(`  Voice: ${voice_name} (${voice_id})`);
  console.log(`  Lyrics: "${text}"`);

  const payload = JSON.stringify({
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.25,
      similarity_boost: 0.8,
      style: 0.6,
      use_speaker_boost: true
    }
  });

  const outputPath = path.join(assetsDir, 'singing.mp3');
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voice_id}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`  ✗ Singing failed: ${res.statusCode} ${body}`);
          reject(new Error(`ElevenLabs API error: ${res.statusCode}`));
        });
        return;
      }
      
      const file = fs.createWriteStream(outputPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(outputPath);
        console.log(`  ✓ Singing: ${outputPath} (${(stat.size/1024).toFixed(1)} KB)`);
        resolve(outputPath);
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Use local background music
 */
async function setupMusic() {
  console.log('\n▶ Setting up background music...');
  
  const sourcePath = path.join(assetsDir, 'background-music.mp3');
  const outputPath = path.join(assetsDir, 'music.mp3');
  
  if (fs.existsSync(sourcePath)) {
    // Copy to music.mp3
    fs.copyFileSync(sourcePath, outputPath);
    const stat = fs.statSync(outputPath);
    console.log(`  ✓ Music: ${outputPath} (${(stat.size/1024/1024).toFixed(1)} MB)`);
    return outputPath;
  }
  
  // Fallback: generate simple tone
  console.log('  ⚠ background-music.mp3 not found, generating fallback...');
  const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=30,volume=0.1" -c:a libmp3lame -b:a 192k "${outputPath}"`;
  execSync(cmd, { stdio: 'pipe' });
  console.log(`  ✓ Fallback music created`);
  return outputPath;
}

/**
 * Generate sound effects with FFmpeg - better click sound
 */
async function generateSFX() {
  console.log('\n▶ Generating sound effects...');
  
  // Click sound - proper UI click with FFT sine
  const clickPath = path.join(sfxDir, 'click.mp3');
  console.log(`  Generating click...`);
  // Use a proper "pop" sound: short burst with attack
  const clickCmd = `ffmpeg -y -f lavfi -i "sine=frequency=1800:duration=0.015,sine=frequency=1200:duration=0.025,sine=frequency=800:duration=0.02" -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1,volume=0.5,afade=t=in:st=0:d=0.005,afade=t=out:st=0.04:d=0.01" -c:a libmp3lame -b:a 128k "${clickPath}" 2>/dev/null || ffmpeg -y -f lavfi -i "sine=frequency=1500:duration=0.05,volume=0.5,afade=t=out:st=0.02:d=0.03" -c:a libmp3lame -b:a 128k "${clickPath}"`;
  try {
    execSync(clickCmd, { stdio: 'pipe' });
    const stat = fs.statSync(clickPath);
    console.log(`  ✓ Click: ${clickPath} (${stat.size} bytes)`);
  } catch (e) {
    // Simple fallback
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=1200:duration=0.05,volume=0.4" -c:a libmp3lame -b:a 128k "${clickPath}"`, { stdio: 'pipe' });
    console.log(`  ✓ Click (simple): ${clickPath}`);
  }
  
  // Whoosh sound
  const whooshPath = path.join(sfxDir, 'whoosh.mp3');
  console.log(`  Generating whoosh...`);
  const whooshCmd = `ffmpeg -y -f lavfi -i "sine=frequency=600:duration=0.3,volume=0.3,lowpass=f=2000,highpass=f=200,afade=t=in:st=0:d=0.05,afade=t=out:st=0.15:d=0.15" -c:a libmp3lame -b:a 128k "${whooshPath}"`;
  execSync(whooshCmd, { stdio: 'pipe' });
  const whooshStat = fs.statSync(whooshPath);
  console.log(`  ✓ Whoosh: ${whooshPath} (${whooshStat.size} bytes)`);
  
  // Transition swoosh
  const transitionPath = path.join(sfxDir, 'transition.mp3');
  console.log(`  Generating transition...`);
  const transitionCmd = `ffmpeg -y -f lavfi -i "sine=frequency=800:duration=0.25,volume=0.35,lowpass=f=1500,afade=t=in:st=0:d=0.03,afade=t=out:st=0.12:d=0.13" -c:a libmp3lame -b:a 128k "${transitionPath}"`;
  execSync(transitionCmd, { stdio: 'pipe' });
  const transStat = fs.statSync(transitionPath);
  console.log(`  ✓ Transition: ${transitionPath} (${transStat.size} bytes)`);
  
  // Success chime - upbeat fanfare with multiple ascending notes
  const chimePath = path.join(sfxDir, 'chime.mp3');
  console.log(`  Generating upbeat chime...`);
  // Create an upbeat fanfare with 4 ascending notes + harmony
  const chimeCmd = `ffmpeg -y \
    -f lavfi -i "sine=frequency=523:duration=0.12,volume=0.6,afade=t=out:st=0.08:d=0.04" \
    -f lavfi -i "sine=frequency=659:duration=0.12,volume=0.6,afade=t=out:st=0.08:d=0.04" \
    -f lavfi -i "sine=frequency=784:duration=0.12,volume=0.6,afade=t=out:st=0.08:d=0.04" \
    -f lavfi -i "sine=frequency=1047:duration=0.25,volume=0.8,afade=t=out:st=0.15:d=0.1" \
    -f lavfi -i "sine=frequency=1319:duration=0.3,volume=0.5,afade=t=out:st=0.2:d=0.1" \
    -filter_complex "[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1,highpass=f=300,lowpass=f=4000" -c:a libmp3lame -b:a 128k "${chimePath}" 2>/dev/null || \
    ffmpeg -y -f lavfi -i "sine=frequency=880:duration=0.4,volume=0.7,afade=t=out:st=0.25:d=0.15" -c:a libmp3lame -b:a 128k "${chimePath}"`;
  execSync(chimeCmd, { stdio: 'pipe' });
  const chimeStat = fs.statSync(chimePath);
  console.log(`  ✓ Chime: ${chimePath} (${chimeStat.size} bytes)`);
  
  return { click: clickPath, whoosh: whooshPath, transition: transitionPath, chime: chimePath };
}

// Main
async function main() {
  try {
    console.log(`Using ElevenLabs API key: ${ELEVENLABS_API_KEY.substring(0, 10)}...`);
    
    // Generate all audio
    await generateVoiceover();
    await generateSinging();
    await downloadMusic();
    await generateSFX();
    
    console.log('\n═══════════════════════════════════════');
    console.log('  Audio generation complete!');
    console.log('═══════════════════════════════════════');
    
    // Summary
    console.log('\nGenerated files:');
    const files = [
      'voiceover.mp3', 'singing.mp3', 'music.mp3',
      'sfx/click.mp3', 'sfx/whoosh.mp3', 'sfx/transition.mp3', 'sfx/chime.mp3'
    ];
    for (const file of files) {
      const fpath = path.join(assetsDir, file);
      if (fs.existsSync(fpath)) {
        const stat = fs.statSync(fpath);
        console.log(`  ✓ ${file} (${(stat.size/1024).toFixed(1)} KB)`);
      } else {
        console.log(`  ✗ ${file} (missing)`);
      }
    }
    
  } catch (error) {
    console.error('\n✗ Audio generation failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log(`Using ElevenLabs API key: ${ELEVENLABS_API_KEY.substring(0, 10)}...`);
    
    // Generate all audio
    await generateVoiceover();
    await generateSinging();
    await setupMusic();
    await generateSFX();
    
    console.log('\n═══════════════════════════════════════');
    console.log('  Audio generation complete!');
    console.log('═══════════════════════════════════════');
    
    // Summary
    console.log('\nGenerated files:');
    const files = [
      'voiceover.mp3', 'singing.mp3', 'music.mp3',
      'sfx/click.mp3', 'sfx/whoosh.mp3', 'sfx/transition.mp3', 'sfx/chime.mp3'
    ];
    for (const file of files) {
      const fpath = path.join(assetsDir, file);
      if (fs.existsSync(fpath)) {
        const stat = fs.statSync(fpath);
        console.log(`  ✓ ${file} (${(stat.size/1024).toFixed(1)} KB)`);
      } else {
        console.log(`  ✗ ${file} (missing)`);
      }
    }
    
  } catch (error) {
    console.error('\n✗ Audio generation failed:', error.message);
    process.exit(1);
  }
}

main();