#!/usr/bin/env node
/**
 * 02-record-demo.js (v3.2)
 * 
 * Records website demo with Playwright.
 * - Proper wait handling for slow loads
 * - Better button click detection
 * - Handles both popup and same-page navigation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.v3.json'), 'utf8'));
const tempDir = path.join(__dirname, '..', 'temp');

fs.mkdirSync(tempDir, { recursive: true });

console.log('═══════════════════════════════════════');
console.log('  Demo Recorder v3.2 (Playwright)');
console.log('═══════════════════════════════════════\n');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: config.demo.viewport.width, height: config.demo.viewport.height },
    recordVideo: {
      dir: tempDir,
      size: { width: config.demo.viewport.width, height: config.demo.viewport.height }
    }
  });

  const page = await context.newPage();
  
  // Target duration tracking
  const targetDuration = config.demo.target_duration || 19;
  const startTime = Date.now();

  console.log(`▶ Starting demo at: ${config.demo.url}`);
  console.log(`  Target duration: ${targetDuration}s`);

  // Process actions
  for (let i = 0; i < config.demo.actions.length; i++) {
    const action = config.demo.actions[i];
    const actionNum = i + 1;
    
    console.log(`  [${actionNum}/${config.demo.actions.length}] ${action.description || action.type}...`);

    switch (action.type) {
      case 'navigate':
        await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log(`    Loaded: ${action.url}`);
        
        // Wait for page to be stable
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
          console.log(`    Note: networkidle timeout, continuing...`);
        });
        
        // Extra wait for slow sites
        if (action.wait_after) {
          console.log(`    Waiting ${action.wait_after/1000}s for page to settle...`);
          await page.waitForTimeout(action.wait_after);
        }
        break;

      case 'click':
        if (action.expect_new_page) {
          console.log(`    Looking for "${action.selector}" button...`);
          
          // Wait for element to be visible and clickable
          try {
            // Try multiple selectors
            let button = null;
            
            // Try role=button first
            try {
              button = await page.waitForSelector('role=button[name=/open app/i]', { timeout: 5000, state: 'visible' });
              console.log(`    Found button via role=button`);
            } catch (e) {}
            
            if (!button) {
              // Try text content
              try {
                button = await page.waitForSelector('text=/open app/i', { timeout: 5000, state: 'visible' });
                console.log(`    Found button via text`);
              } catch (e) {}
            }
            
            if (!button) {
              // Try any clickable element with "open app" text
              try {
                button = await page.waitForSelector('a:has-text("open app"), button:has-text("open app")', { timeout: 5000, state: 'visible' });
                console.log(`    Found clickable element`);
              } catch (e) {}
            }

            if (button) {
              // Scroll into view and click
              await button.scrollIntoViewIfNeeded();
              await page.waitForTimeout(500); // Small pause before click
              
              console.log(`    Clicking button...`);
              
              // Add click animation with bubble
              await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('*')).find(el => 
                  el.textContent && el.textContent.toLowerCase().includes('open app'));
                
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  
                  // Create animated bubble
                  const bubble = document.createElement('div');
                  bubble.style.cssText = 
                    'position: fixed;' +
                    'left: ' + (rect.left + rect.width/2 - 15) + 'px;' +
                    'top: ' + (rect.top + rect.height/2 - 15) + 'px;' +
                    'width: 30px;' +
                    'height: 30px;' +
                    'background: radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.1) 70%, transparent 100%);' +
                    'border: 2px solid rgba(59,130,246,0.6);' +
                    'border-radius: 50%;' +
                    'pointer-events: none;' +
                    'z-index: 10000;' +
                    'animation: clickBubble 0.8s ease-out forwards;';
                  
                  const style = document.createElement('style');
                  style.textContent = 
                    '@keyframes clickBubble {' +
                    '  0% { transform: scale(0.5); opacity: 1; }' +
                    '  50% { transform: scale(1.2); opacity: 0.7; }' +
                    '  100% { transform: scale(2); opacity: 0; }' +
                    '}';
                  document.head.appendChild(style);
                  document.body.appendChild(bubble);
                  
                  // Remove after animation
                  setTimeout(() => {
                    bubble.remove();
                    style.remove();
                  }, 800);
                }
              });
              
              // Wait for animation to start
              await page.waitForTimeout(200);
              
              // Try popup detection first
              let newPage = null;
              try {
                [newPage] = await Promise.all([
                  context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
                  button.click()
                ]);
              } catch (e) {
                // Click succeeded but no popup
                newPage = null;
              }
              
              if (newPage) {
                // Popup appeared
                console.log(`    New page opened: ${newPage.url()}`);
                await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
                await newPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
                
                const waitTime = action.new_page_wait || 5000;
                console.log(`    Waiting ${waitTime/1000}s on new page...`);
                await newPage.waitForTimeout(waitTime);
                
                // Screenshot for debugging
                await newPage.screenshot({ path: path.join(tempDir, 'new-page.png') });
                console.log(`    Screenshot saved`);
                
                await newPage.close();
                console.log(`    Closed new page`);
              } else {
                // Same-page navigation
                console.log(`    Button clicked, checking for navigation...`);
                await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
                
                const currentUrl = page.url();
                console.log(`    Current URL: ${currentUrl}`);
                
                // Wait a bit for page to settle
                await page.waitForTimeout(1000);
                
                // Scroll to explore the new page content
                console.log(`    Scrolling new page to show content...`);
                await page.evaluate(() => {
                  window.scrollTo({ top: 500, behavior: 'smooth' });
                });
                await page.waitForTimeout(800);
                
                await page.evaluate(() => {
                  window.scrollTo({ top: 1000, behavior: 'smooth' });
                });
                await page.waitForTimeout(800);
                
                // Scroll to bottom
                await page.evaluate(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                });
                await page.waitForTimeout(1000);
                
                console.log(`    Finished exploring new page`);
                
                // Screenshot for debugging
                await page.screenshot({ path: path.join(tempDir, 'post-click.png') });
                console.log(`    Screenshot saved`);
              }
            } else {
              console.log(`    ⚠ Button not found, skipping`);
            }
          } catch (e) {
            console.log(`    Click error: ${e.message}`);
          }
        } else {
          // Regular click
          try {
            await page.click(action.selector);
            if (action.wait_after) await page.waitForTimeout(action.wait_after);
          } catch (e) {
            console.log(`    Click failed: ${e.message}`);
          }
        }
        break;

      case 'scroll':
        await page.evaluate(({ direction, amount }) => {
          window.scrollBy({
            top: direction === 'down' ? amount : -amount,
            behavior: 'smooth'
          });
        }, { direction: action.direction, amount: action.amount });
        if (action.wait_after) await page.waitForTimeout(action.wait_after);
        break;

      case 'wait':
        await page.waitForTimeout(action.duration);
        break;
    }
  }

  // Wait for remaining time if under target
  const elapsed = (Date.now() - startTime) / 1000;
  const remaining = targetDuration - elapsed;
  if (remaining > 0) {
    console.log(`  Waiting ${remaining.toFixed(1)}s to reach target duration...`);
    await page.waitForTimeout(remaining * 1000);
  }

  await browser.close();

  // Find and rename video
  const videos = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
  if (videos.length > 0) {
    const videoPath = path.join(tempDir, videos[0]);
    const stats = fs.statSync(videoPath);
    console.log(`\n✓ Video saved: ${videoPath}`);
    console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Save manifest
    const manifest = {
      video: videoPath,
      duration: Math.min(elapsed, targetDuration),
      created: new Date().toISOString(),
      config: config.demo
    };
    fs.writeFileSync(path.join(tempDir, 'demo-manifest.json'), JSON.stringify(manifest, null, 2));
  } else {
    console.error('\n✗ No video file created');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  Demo recording complete');
  console.log('═══════════════════════════════════════');
})();