#!/usr/bin/env node
/**
 * Generate Hackathon Presentation Video
 * 
 * Creates a 60-second presentation video from HTML slides
 * with professional voiceover for the Synthesis Hackathon
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config-hackathon-presentation.json'), 'utf8'));
const outputDir = path.join(__dirname, '..', 'output');
const tempDir = path.join(__dirname, '..', 'temp');
const slidesDir = path.join(__dirname, '..', 'slides');

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('═══════════════════════════════════════');
console.log('  Syntrophic Hackathon Presentation');
console.log('═══════════════════════════════════════\n');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Step 1: Capture all slides
    console.log('▶ Capturing slides...\n');
    
    const slideFiles = [];
    const slides = ['title', 'problem', 'solution', 'impact'];
    
    for (const slideName of slides) {
      const slideConfig = config.slides[slideName];
      if (!slideConfig.enabled) continue;
      
      console.log(`  Capturing ${slideName} slide...`);
      
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const htmlPath = path.join(__dirname, '..', slideConfig.file);
      await page.goto(`file://${htmlPath}`);
      await page.waitForTimeout(1000); // Wait for animations
      
      const screenshotPath = path.join(tempDir, `${slideName}.png`);
      await page.screenshot({ path: screenshotPath });
      
      // Convert to video with duration
      const videoPath = path.join(tempDir, `${slideName}.mp4`);
      const duration = slideConfig.duration;
      
      execSync(`ffmpeg -y -loop 1 -i "${screenshotPath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -vf "scale=1920:1080" "${videoPath}"`, { stdio: 'pipe' });
      
      slideFiles.push({
        name: slideName,
        video: videoPath,
        duration: duration
      });
      
      await page.close();
      console.log(`  ✓ ${slideName}: ${duration}s`);
    }
    
    // Step 2: Create concatenation file
    console.log('\n▶ Concatenating slides...\n');
    
    const concatList = path.join(tempDir, 'concat-list.txt');
    const concatContent = slideFiles.map(s => `file '${s.video}'`).join('\n');
    fs.writeFileSync(concatList, concatContent);
    
    const baseVideo = path.join(tempDir, 'base-video.mp4');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${baseVideo}"`, { stdio: 'pipe' });
    
    console.log('  ✓ Base video created');
    
    // Step 3: Generate voiceover segments
    console.log('\n▶ Generating voiceover...\n');
    
    if (config.audio.voiceover.enabled) {
      // In production, this would call ElevenLabs API
      // For now, we'll create placeholder audio files
      console.log('  ⚠ Voiceover generation requires ElevenLabs API');
      console.log('  Using config script:', Object.keys(config.audio.voiceover.script));
    }
    
    // Step 4: Add background music
    console.log('\n▶ Adding background music...\n');
    
    const finalVideo = path.join(outputDir, config.project.output);
    
    if (config.audio.music.enabled && fs.existsSync(path.join(__dirname, '..', config.audio.music.file))) {
      const musicCmd = `ffmpeg -y -i "${baseVideo}" -i "${path.join(__dirname, '..', config.audio.music.file)}" ` +
        `-filter_complex "[1:a]volume=${config.audio.music.volume},afade=t=in:st=0:d=${config.audio.music.fade_in},` +
        `afade=t=out:st=${60 - config.audio.music.fade_out}:d=${config.audio.music.fade_out}[music];` +
        `[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[outa]" ` +
        `-map 0:v -map "[outa]" -c:v copy -c:a aac -shortest "${finalVideo}"`;
      
      try {
        execSync(musicCmd, { stdio: 'pipe' });
        console.log('  ✓ Background music added');
      } catch (e) {
        // If no audio track in base video, just add music
        execSync(`ffmpeg -y -i "${baseVideo}" -i "${path.join(__dirname, '..', config.audio.music.file)}" ` +
          `-filter_complex "[1:a]volume=${config.audio.music.volume}[outa]" ` +
          `-map 0:v -map "[outa]" -c:v copy -c:a aac -shortest "${finalVideo}"`, { stdio: 'pipe' });
        console.log('  ✓ Background music added');
      }
    } else {
      fs.copyFileSync(baseVideo, finalVideo);
    }
    
    // Get final stats
    const stats = fs.statSync(finalVideo);
    const duration = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalVideo}"`, { encoding: 'utf8' }).trim();
    
    console.log('\n═══════════════════════════════════════');
    console.log('  Presentation Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`\n  Output: ${finalVideo}`);
    console.log(`  Duration: ${parseFloat(duration).toFixed(1)}s`);
    console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Resolution: ${config.quality.resolution}`);
    console.log('\n  Next steps:');
    console.log('  1. Generate voiceover with ElevenLabs');
    console.log('  2. Re-run with audio tracks');
    console.log('  3. Upload to hackathon submission\n');
    
  } finally {
    await browser.close();
  }
})();