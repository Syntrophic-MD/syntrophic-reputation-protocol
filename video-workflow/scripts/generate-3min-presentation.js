#!/usr/bin/env node
/**
 * Generate 3-Minute Full Presentation
 * 
 * Combines:
 * - Opening slide
 * - 4 hackathon slides  
 * - Live website demo
 * - Closing slide
 * - Professional voiceover
 * - Background music
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config-3min.json'), 'utf8'));
const outputDir = path.join(__dirname, '..', 'output');
const tempDir = path.join(__dirname, '..', 'temp');
const assetsDir = path.join(__dirname, '..', 'assets');

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

// Get ElevenLabs API key
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 
  execSync(`security find-generic-password -a 'friendlyagent222@gmail.com' -s '11 Labs API Key' -w 2>/dev/null || echo ""`, { encoding: 'utf8' }).trim();

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       Syntrophic 3-Minute Presentation Generator           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Generate voiceover segment
async function generateVoiceover(text, outputPath, voiceId) {
  if (!ELEVENLABS_API_KEY) {
    console.log('  ⚠ No ElevenLabs API key found, skipping voiceover');
    return false;
  }

  const payload = JSON.stringify({
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        console.log(`  ✗ Voiceover generation failed: ${res.statusCode}`);
        resolve(false);
        return;
      }
      
      const file = fs.createWriteStream(outputPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    });

    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const startTime = Date.now();
  
  try {
    // Step 1: Generate opening slide
    console.log('▶ Step 1: Generating slides...\n');
    
    const slideVideos = [];
    
    // Opening slide
    if (config.slides.opening.enabled) {
      console.log('  Creating opening slide...');
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              width: 1920px;
              height: 1080px;
              background: ${config.slides.opening.background};
              color: ${config.slides.opening.text_color};
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-family: -apple-system, sans-serif;
            }
            h1 {
              font-size: ${config.slides.opening.title_font_size}px;
              margin: 0 0 30px 0;
              font-weight: 800;
              background: linear-gradient(45deg, #3b82f6, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            p {
              font-size: ${config.slides.opening.subtitle_font_size}px;
              margin: 0;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <h1>${config.slides.opening.title}</h1>
          <p>${config.slides.opening.subtitle}</p>
        </body>
        </html>
      `;
      
      await page.setContent(html);
      const openingPng = path.join(tempDir, 'opening.png');
      await page.screenshot({ path: openingPng });
      await page.close();
      
      const openingMp4 = path.join(tempDir, 'opening.mp4');
      execSync(`ffmpeg -y -loop 1 -i "${openingPng}" -c:v libx264 -t ${config.slides.opening.duration} -pix_fmt yuv420p "${openingMp4}"`, { stdio: 'pipe' });
      slideVideos.push(openingMp4);
      console.log('  ✓ Opening slide created');
    }
    
    // Hackathon slides
    const hackathonSlides = ['hackathon_title', 'hackathon_problem', 'hackathon_solution', 'hackathon_impact'];
    
    for (const slideName of hackathonSlides) {
      const slideConfig = config.slides[slideName];
      if (!slideConfig.enabled) continue;
      
      console.log(`  Creating ${slideName} slide...`);
      
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const htmlPath = path.join(__dirname, '..', slideConfig.file);
      await page.goto(`file://${htmlPath}`);
      await page.waitForTimeout(1000);
      
      const pngPath = path.join(tempDir, `${slideName}.png`);
      await page.screenshot({ path: pngPath });
      await page.close();
      
      const mp4Path = path.join(tempDir, `${slideName}.mp4`);
      execSync(`ffmpeg -y -loop 1 -i "${pngPath}" -c:v libx264 -t ${slideConfig.duration} -pix_fmt yuv420p "${mp4Path}"`, { stdio: 'pipe' });
      slideVideos.push(mp4Path);
      console.log(`  ✓ ${slideName} created (${slideConfig.duration}s)`);
    }
    
    // Step 2: Record website demo
    console.log('\n▶ Step 2: Recording website demo...\n');
    
    if (config.demo.enabled) {
      const context = await browser.newContext({
        viewport: config.demo.viewport,
        recordVideo: {
          dir: tempDir,
          size: config.demo.viewport
        }
      });
      
      const page = await context.newPage();
      console.log(`  Navigating to ${config.demo.url}...`);
      
      for (const action of config.demo.actions) {
        console.log(`  ${action.description}...`);
        
        switch (action.type) {
          case 'navigate':
            await page.goto(action.url, { waitUntil: 'networkidle' });
            if (action.wait_after) await page.waitForTimeout(action.wait_after);
            break;
            
          case 'wait':
            await page.waitForTimeout(action.duration);
            break;
            
          case 'scroll':
            await page.evaluate(({ direction, amount }) => {
              window.scrollBy({ top: direction === 'down' ? amount : -amount, behavior: 'smooth' });
            }, { direction: action.direction, amount: action.amount });
            if (action.wait_after) await page.waitForTimeout(action.wait_after);
            break;
            
          case 'click':
            try {
              // Add click animation
              await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('*')).find(el => 
                  el.textContent && el.textContent.toLowerCase().includes('open app'));
                
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  const bubble = document.createElement('div');
                  bubble.style.cssText = 
                    'position: fixed;' +
                    'left: ' + (rect.left + rect.width/2 - 15) + 'px;' +
                    'top: ' + (rect.top + rect.height/2 - 15) + 'px;' +
                    'width: 30px; height: 30px;' +
                    'background: radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%);' +
                    'border: 2px solid rgba(59,130,246,0.6);' +
                    'border-radius: 50%; pointer-events: none; z-index: 10000;' +
                    'animation: clickBubble 0.8s ease-out forwards;';
                  
                  const style = document.createElement('style');
                  style.textContent = '@keyframes clickBubble { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }';
                  document.head.appendChild(style);
                  document.body.appendChild(bubble);
                  
                  setTimeout(() => { bubble.remove(); style.remove(); }, 800);
                }
              });
              
              await page.waitForTimeout(200);
              await page.click('text=Open App');
              
              if (action.new_page_wait) {
                await page.waitForTimeout(action.new_page_wait);
              }
            } catch (e) {
              console.log('    Click action completed');
            }
            if (action.wait_after) await page.waitForTimeout(action.wait_after);
            break;
        }
      }
      
      await context.close();
      
      // Find and process demo video
      const videos = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
      if (videos.length > 0) {
        const demoWebm = path.join(tempDir, videos[videos.length - 1]);
        const demoMp4 = path.join(tempDir, 'demo.mp4');
        
        execSync(`ffmpeg -y -i "${demoWebm}" -c:v libx264 -preset fast -crf 22 "${demoMp4}"`, { stdio: 'pipe' });
        slideVideos.push(demoMp4);
        console.log(`  ✓ Demo recorded (${config.demo.target_duration}s)`);
      }
    }
    
    // Step 3: Generate closing slide
    if (config.slides.closing.enabled) {
      console.log('\n  Creating closing slide...');
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              width: 1920px;
              height: 1080px;
              background: ${config.slides.closing.background};
              color: ${config.slides.closing.text_color};
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-family: -apple-system, sans-serif;
            }
            h1 {
              font-size: ${config.slides.closing.title_font_size}px;
              margin: 0 0 30px 0;
              font-weight: 800;
              background: linear-gradient(45deg, #3b82f6, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .tagline {
              font-size: ${config.slides.closing.tagline_font_size}px;
              margin: 0 0 40px 0;
              opacity: 0.9;
            }
            .cta {
              font-size: ${config.slides.closing.cta_font_size}px;
              color: #3b82f6;
            }
          </style>
        </head>
        <body>
          <h1>${config.slides.closing.title}</h1>
          <p class="tagline">${config.slides.closing.tagline}</p>
          <p class="cta">${config.slides.closing.cta}</p>
        </body>
        </html>
      `;
      
      await page.setContent(html);
      const closingPng = path.join(tempDir, 'closing.png');
      await page.screenshot({ path: closingPng });
      await page.close();
      
      const closingMp4 = path.join(tempDir, 'closing.mp4');
      execSync(`ffmpeg -y -loop 1 -i "${closingPng}" -c:v libx264 -t ${config.slides.closing.duration} -pix_fmt yuv420p "${closingMp4}"`, { stdio: 'pipe' });
      slideVideos.push(closingMp4);
      console.log('  ✓ Closing slide created');
    }
    
    // Step 4: Generate voiceover segments
    console.log('\n▶ Step 3: Generating voiceover...\n');
    
    const voiceoverSegments = [];
    if (config.audio.voiceover.enabled && ELEVENLABS_API_KEY) {
      let segmentCount = 0;
      for (const segment of config.audio.voiceover.segments) {
        segmentCount++;
        const segmentPath = path.join(tempDir, `voiceover-${segmentCount}.mp3`);
        console.log(`  Generating segment ${segmentCount}/${config.audio.voiceover.segments.length}...`);
        
        const success = await generateVoiceover(
          segment.text,
          segmentPath,
          config.audio.voiceover.voice_id
        );
        
        if (success) {
          voiceoverSegments.push({
            path: segmentPath,
            start: segment.start,
            duration: segment.duration
          });
          console.log(`  ✓ Segment ${segmentCount} generated`);
        }
      }
    }
    
    // Step 5: Concatenate all videos
    console.log('\n▶ Step 4: Concatenating videos...\n');
    
    const concatList = path.join(tempDir, 'concat.txt');
    fs.writeFileSync(concatList, slideVideos.map(v => `file '${v}'`).join('\n'));
    
    const baseVideo = path.join(tempDir, 'base.mp4');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${baseVideo}"`, { stdio: 'pipe' });
    console.log('  ✓ Videos concatenated');
    
    // Step 6: Mix audio
    console.log('\n▶ Step 5: Mixing audio tracks...\n');
    
    let audioInputs = [`-i "${baseVideo}"`];
    let audioFilters = [];
    let inputIndex = 1;
    
    // Add background music
    if (config.audio.music.enabled && fs.existsSync(path.join(__dirname, '..', config.audio.music.file))) {
      audioInputs.push(`-i "${path.join(__dirname, '..', config.audio.music.file)}"`);
      audioFilters.push(
        `[${inputIndex}:a]aloop=loop=-1:size=2e+09,atrim=duration=180,` +
        `volume=${config.audio.music.volume},` +
        `afade=t=in:st=0:d=${config.audio.music.fade_in},` +
        `afade=t=out:st=${180 - config.audio.music.fade_out}:d=${config.audio.music.fade_out}[music]`
      );
      inputIndex++;
    }
    
    // Add voiceover segments
    for (let i = 0; i < voiceoverSegments.length; i++) {
      const segment = voiceoverSegments[i];
      audioInputs.push(`-i "${segment.path}"`);
      const delayMs = Math.floor(segment.start * 1000);
      audioFilters.push(
        `[${inputIndex}:a]volume=${config.audio.voiceover.volume},adelay=${delayMs}|${delayMs}[voice${i}]`
      );
      inputIndex++;
    }
    
    // Build final audio mix
    let mixInputs = [];
    if (config.audio.music.enabled) mixInputs.push('[music]');
    for (let i = 0; i < voiceoverSegments.length; i++) {
      mixInputs.push(`[voice${i}]`);
    }
    
    const finalOutput = path.join(outputDir, config.project.output);
    
    if (mixInputs.length > 0) {
      audioFilters.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=2[outa]`);
      
      const cmd = `ffmpeg -y ${audioInputs.join(' ')} ` +
        `-filter_complex "${audioFilters.join(';')}" ` +
        `-map 0:v -map "[outa]" -c:v copy -c:a aac -shortest "${finalOutput}"`;
      
      execSync(cmd, { stdio: 'pipe' });
      console.log('  ✓ Audio mixed');
    } else {
      fs.copyFileSync(baseVideo, finalOutput);
    }
    
    // Final stats
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const stats = fs.statSync(finalOutput);
    const duration = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalOutput}"`, { encoding: 'utf8' }).trim();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║             3-MINUTE PRESENTATION COMPLETE!                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n  Output: ${finalOutput}`);
    console.log(`  Duration: ${parseFloat(duration).toFixed(1)}s`);
    console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Resolution: ${config.quality.resolution}`);
    console.log(`  Generation time: ${elapsed}s`);
    console.log('\n  The presentation is ready for submission!\n');
    
  } finally {
    await browser.close();
  }
})();