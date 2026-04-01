#!/usr/bin/env node
/**
 * 01-generate-slides.js
 * 
 * Generates opening and closing slides using Playwright to screenshot HTML.
 * Much more reliable than FFmpeg text rendering.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

// Ensure directories exist
const tempDir = path.join(__dirname, '..', 'temp');
fs.mkdirSync(tempDir, { recursive: true });

/**
 * Generate HTML slide
 */
function generateSlideHTML(slideConfig, slideName) {
  const { title, subtitle, background, text_color, tagline, cta } = slideConfig;
  const textColor = text_color || '#ffffff';
  const bgColor = background || '#0a0a0f';

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px;
      height: 1080px;
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    h1 {
      font-size: 96px;
      font-weight: 700;
      color: ${textColor};
      margin-bottom: ${subtitle ? '40px' : '0'};
      letter-spacing: -2px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .subtitle {
      font-size: 42px;
      font-weight: 300;
      color: ${textColor};
      opacity: 0.9;
      margin-top: 10px;
    }
    .tagline {
      font-size: 42px;
      font-weight: 400;
      color: ${textColor};
      opacity: 0.95;
      margin-top: 20px;
    }
    .cta {
      font-size: 28px;
      font-weight: 300;
      color: ${textColor};
      opacity: 0.7;
      margin-top: 60px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    ${tagline ? `<div class="tagline">${tagline}</div>` : ''}
    ${cta ? `<div class="cta">${cta}</div>` : ''}
  </div>
</body>
</html>`;
}

/**
 * Generate slide using Playwright screenshot + FFmpeg
 */
async function generateSlide(slideConfig, slideName) {
  if (!slideConfig.enabled) {
    console.log(`⊘ ${slideName} slide disabled, skipping`);
    return null;
  }

  console.log(`\n▶ Generating ${slideName} slide...`);

  // Generate HTML
  const html = generateSlideHTML(slideConfig, slideName);
  const htmlPath = path.join(tempDir, `slide-${slideName}.html`);
  const pngPath = path.join(tempDir, `slide-${slideName}.png`);
  const mp4Path = path.join(tempDir, `slide-${slideName}.mp4`);

  fs.writeFileSync(htmlPath, html);

  // Take screenshot with Playwright
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(500); // Wait for fonts to load
  await page.screenshot({ path: pngPath, fullPage: false });
  await browser.close();

  console.log(`  ✓ Screenshot: ${pngPath}`);

  // Convert PNG to MP4 with duration
  const { duration, animation } = slideConfig;
  
  // Build FFmpeg video filter for fade effects
  let vf = '';
  if (animation === 'fade_in') {
    vf = `-vf "fade=t=in:st=0:d=1"`;
  } else if (animation === 'fade_out') {
    vf = `-vf "fade=t=out:st=${Math.max(0, duration - 1)}:d=1"`;
  }

  const cmd = `ffmpeg -y -loop 1 -i "${pngPath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -r 30 ${vf} "${mp4Path}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  ✓ Video: ${mp4Path}`);
    return mp4Path;
  } catch (error) {
    console.error(`  ✗ Failed to create video: ${error.message}`);
    return null;
  }
}

// Main
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Slide Generator (Playwright + FFmpeg)');
  console.log('═══════════════════════════════════════');

  const openingSlide = await generateSlide(config.slides.opening, 'opening');
  const closingSlide = await generateSlide(config.slides.closing, 'closing');

  console.log('\n═══════════════════════════════════════');
  console.log('  Done generating slides');
  console.log('═══════════════════════════════════════');

  // Export paths for other scripts
  fs.writeFileSync(path.join(tempDir, 'slides-manifest.json'), JSON.stringify({
    opening: openingSlide,
    closing: closingSlide,
    generatedAt: new Date().toISOString()
  }, null, 2));
}

main().catch(console.error);