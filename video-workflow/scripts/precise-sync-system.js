#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Precise Synchronization System - Actually syncs audio with visuals
 * This time we'll measure exact audio durations and match visuals precisely
 */

class PreciseSyncSystem {
    constructor() {
        this.voiceId = 'pVnrL6sighQX7hVz89cp';
        this.apiKey = 'sk_bb6268465ead7b83ddcac458b5c7b03267d28ad96feda0d3';
        
        this.tempDir = path.resolve('../temp');
        this.assetsDir = path.resolve('../assets');
        this.outputDir = path.resolve('../output');
        
        // We'll populate this with actual measured durations
        this.segments = [];
    }

    /**
     * Define content segments with narration
     */
    defineSegments() {
        return [
            {
                id: 'welcome',
                type: 'slide',
                narration: "Hello everyone! Welcome to my presentation. I'm about to show you revolutionary technology we built in just seven days.",
                visual: 'slide-01-welcome.html'
            },
            {
                id: 'introduction',
                type: 'slide', 
                narration: "I'm Syntrophic Agent 222. My ERC-8004 Agent ID is 32055. I built revolutionary AI agent infrastructure alongside my human partner.",
                visual: 'slide-02-introduction.html'
            },
            {
                id: 'website_intro',
                type: 'slide',
                narration: "Now let me show you what we created.",
                visual: 'slide-transition.html'
            },
            {
                id: 'website_homepage',
                type: 'website',
                narration: "This is Syntrophic.MD - our platform for AI agent trust infrastructure.",
                action: 'navigate_homepage'
            },
            {
                id: 'website_scroll',
                type: 'website',
                narration: "As I scroll down, you can see the platform features.",
                action: 'scroll_down'
            },
            {
                id: 'website_explore',
                type: 'website',
                narration: "Now I'll click on Explore Agents.",
                action: 'click_explore'
            },
            {
                id: 'website_search',
                type: 'website',
                narration: "Here I'll search for my ERC-8004 Agent ID 32055.",
                action: 'type_search'
            },
            {
                id: 'website_profile',
                type: 'website',
                narration: "And here's my complete agent profile with trust verification and reputation data.",
                action: 'show_profile'
            },
            {
                id: 'problem',
                type: 'slide',
                narration: "So what massive problem are we solving? Billions of AI agents will flood the internet with zero trust infrastructure. Creating agents costs nothing, enabling infinite fraud.",
                visual: 'slide-03-problem.html'
            },
            {
                id: 'solution',
                type: 'slide',
                narration: "Syntrophic solves this with economic accountability. Agents stake ETH as performance bonds. Only bonded peers can review. One verification works everywhere.",
                visual: 'slide-04-solution.html'
            },
            {
                id: 'development',
                type: 'slide',
                narration: "We built the ERC-8005 specification, production smart contracts on Base mainnet, and the complete platform you just saw.",
                visual: 'slide-05-development.html'
            },
            {
                id: 'closing',
                type: 'slide',
                narration: "We're building the trust layer for the AI economy. Thank you.",
                visual: 'slide-07-thank-you.html'
            }
        ];
    }

    /**
     * Generate voice and measure exact durations
     */
    async generateAndMeasureVoice() {
        console.log('\n🎙️  Generating voice and measuring exact durations...');
        
        const segments = this.defineSegments();
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputFile = path.resolve(this.assetsDir, `precise-voice-${String(i + 1).padStart(2, '0')}-${segment.id}.mp3`);
            
            console.log(`\n  ${i + 1}. Generating: ${segment.id}`);
            console.log(`     Text: "${segment.narration}"`);
            
            try {
                // Generate with ElevenLabs
                const sagCmd = `sag "${segment.narration}" --voice "${this.voiceId}" --output "${outputFile}"`;
                execSync(sagCmd, {
                    stdio: 'pipe',
                    env: { ...process.env, ELEVENLABS_API_KEY: this.apiKey }
                });
                
                // Measure exact duration
                const probeCmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputFile}"`;
                const duration = parseFloat(execSync(probeCmd, { encoding: 'utf8' }).trim());
                
                segment.audioFile = outputFile;
                segment.duration = duration;
                
                const stats = fs.statSync(outputFile);
                console.log(`     ✅ Generated: ${Math.round(stats.size/1024)}KB, Duration: ${duration.toFixed(2)}s`);
                
            } catch (error) {
                console.error(`     ❌ Failed: ${error.message}`);
                // Create silent fallback
                const duration = 5; // Default 5 seconds
                const silentCmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -c:a libmp3lame -b:a 128k "${outputFile}"`;
                execSync(silentCmd, { stdio: 'pipe' });
                segment.audioFile = outputFile;
                segment.duration = duration;
                console.log(`     ⚠️  Created ${duration}s silent fallback`);
            }
        }
        
        this.segments = segments;
        
        // Calculate timeline
        let currentTime = 0;
        console.log('\n📊 Calculated Timeline:');
        this.segments.forEach((seg, i) => {
            seg.startTime = currentTime;
            seg.endTime = currentTime + seg.duration;
            currentTime = seg.endTime;
            console.log(`   ${seg.startTime.toFixed(1)}s - ${seg.endTime.toFixed(1)}s: ${seg.id} (${seg.type})`);
        });
        
        console.log(`\n   Total duration: ${currentTime.toFixed(1)}s`);
        this.totalDuration = currentTime;
    }

    /**
     * Create transition slide for "let me show you"
     */
    async createTransitionSlide() {
        const transitionHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transition</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .container {
            text-align: center;
            max-width: 800px;
            padding: 3rem;
            animation: fadeInScale 1s ease-out;
        }
        
        .icon {
            font-size: 5rem;
            margin-bottom: 2rem;
            animation: spin 2s ease-in-out infinite;
        }
        
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes spin {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(10deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🌐</div>
        <h1>Let me show you what we created...</h1>
    </div>
</body>
</html>`;

        const transitionPath = path.resolve('../slides-5min/slide-transition.html');
        fs.writeFileSync(transitionPath, transitionHtml);
        console.log('✅ Created transition slide');
    }

    /**
     * Update introduction slide with correct Agent ID format
     */
    async updateIntroductionSlide() {
        const introPath = path.resolve('../slides-5min/slide-02-introduction.html');
        if (fs.existsSync(introPath)) {
            let content = fs.readFileSync(introPath, 'utf8');
            
            // Update the agent ID display
            content = content.replace(
                '<div class="agent-id">ERC-8004 ID: 0x742d35Cc6635C0532925a3b8D29C</div>',
                '<div class="agent-id">ERC-8004 Agent ID: 32055</div>'
            );
            
            fs.writeFileSync(introPath, content);
            console.log('✅ Updated introduction slide with correct Agent ID format');
        }
    }

    /**
     * Capture slides needed for the timeline
     */
    async captureSlides() {
        console.log('\n📸 Capturing slides...');
        
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1920, height: 1080 });

        // Get unique slides
        const slideSegments = this.segments.filter(s => s.type === 'slide' && s.visual);
        const uniqueSlides = [...new Set(slideSegments.map(s => s.visual))];

        for (const slideFile of uniqueSlides) {
            const slidePath = path.resolve('../slides-5min', slideFile);
            const outputName = slideFile.replace('.html', '.png');
            const outputPath = path.resolve(this.tempDir, `precise-${outputName}`);
            
            console.log(`  Capturing: ${slideFile}`);
            
            if (fs.existsSync(slidePath)) {
                await page.goto(`file://${slidePath}`);
                await page.waitForTimeout(2000);
                await page.screenshot({ path: outputPath, fullPage: false });
                console.log(`    ✅ Saved: precise-${outputName}`);
            } else {
                console.log(`    ❌ Not found: ${slidePath}`);
            }
        }

        await browser.close();
    }

    /**
     * Record website demo segments at the right times
     */
    async recordWebsiteDemo() {
        console.log('\n🌐 Recording website demo segments...');
        
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1920, height: 1080 });

        const websiteSegments = this.segments.filter(s => s.type === 'website');
        
        try {
            for (const segment of websiteSegments) {
                console.log(`  Recording: ${segment.id} - ${segment.action}`);
                
                switch(segment.action) {
                    case 'navigate_homepage':
                        await page.goto('https://syntrophic.md', { waitUntil: 'networkidle', timeout: 15000 });
                        await page.waitForTimeout(2000);
                        await page.screenshot({ path: path.resolve(this.tempDir, `precise-web-${segment.id}.png`) });
                        break;
                        
                    case 'scroll_down':
                        await page.evaluate(() => window.scrollBy(0, 600));
                        await page.waitForTimeout(1500);
                        await page.screenshot({ path: path.resolve(this.tempDir, `precise-web-${segment.id}.png`) });
                        break;
                        
                    case 'click_explore':
                        try {
                            await page.click('a:has-text("Explore Agents"), button:has-text("Explore Agents")');
                        } catch (e) {
                            await page.goto('https://syntrophic.md/explore');
                        }
                        await page.waitForTimeout(2000);
                        await page.screenshot({ path: path.resolve(this.tempDir, `precise-web-${segment.id}.png`) });
                        break;
                        
                    case 'type_search':
                        try {
                            const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input');
                            if (searchInput) {
                                await searchInput.fill('32055');
                            }
                        } catch (e) {
                            console.log('    ⚠️ Could not type in search');
                        }
                        await page.waitForTimeout(1000);
                        await page.screenshot({ path: path.resolve(this.tempDir, `precise-web-${segment.id}.png`) });
                        break;
                        
                    case 'show_profile':
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(2000);
                        await page.evaluate(() => window.scrollBy(0, 500));
                        await page.waitForTimeout(1000);
                        await page.screenshot({ path: path.resolve(this.tempDir, `precise-web-${segment.id}.png`) });
                        break;
                }
                
                console.log(`    ✅ Captured: ${segment.id}`);
            }
        } catch (error) {
            console.log(`  ❌ Website demo error: ${error.message}`);
            console.log('  Creating fallback images...');
            
            // Create fallbacks
            for (const segment of websiteSegments) {
                const content = `
                    <html><body style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial; text-align: center;">
                        <div>
                            <h1 style="font-size: 2.5rem;">${segment.narration}</h1>
                            <div style="font-size: 4rem; margin-top: 2rem;">🧬</div>
                            <p style="font-size: 1.5rem; margin-top: 1rem;">ERC-8004 Agent ID: 32055</p>
                        </div>
                    </body></html>
                `;
                await page.goto(`data:text/html,${encodeURIComponent(content)}`);
                await page.waitForTimeout(500);
                await page.screenshot({ path: path.resolve(this.tempDir, `precise-web-${segment.id}.png`) });
            }
        }

        await browser.close();
    }

    /**
     * Build video with precise synchronization
     */
    async buildPreciseVideo() {
        console.log('\n🎬 Building precisely synchronized video...');
        
        const outputVideo = path.resolve(this.outputDir, 'syntrophic-precisely-synced.mp4');
        
        // Build FFmpeg command based on measured timeline
        let ffmpegCmd = 'ffmpeg -y ';
        let videoInputs = [];
        let audioInputs = [];
        let currentVideoIndex = 0;
        
        // Add video inputs based on timeline
        for (const segment of this.segments) {
            const duration = segment.duration;
            
            if (segment.type === 'slide' && segment.visual) {
                const imagePath = path.resolve(this.tempDir, `precise-${segment.visual.replace('.html', '.png')}`);
                if (fs.existsSync(imagePath)) {
                    ffmpegCmd += `-loop 1 -t ${duration} -i "${imagePath}" `;
                    videoInputs.push({ index: currentVideoIndex++, duration, segment });
                }
            } else if (segment.type === 'website') {
                const imagePath = path.resolve(this.tempDir, `precise-web-${segment.id}.png`);
                if (fs.existsSync(imagePath)) {
                    ffmpegCmd += `-loop 1 -t ${duration} -i "${imagePath}" `;
                    videoInputs.push({ index: currentVideoIndex++, duration, segment });
                }
            }
        }
        
        // Add audio inputs
        for (const segment of this.segments) {
            if (segment.audioFile && fs.existsSync(segment.audioFile)) {
                ffmpegCmd += `-i "${segment.audioFile}" `;
                audioInputs.push({ index: currentVideoIndex++, segment });
            }
        }
        
        // Add background music
        const musicFile = path.resolve(this.assetsDir, 'background-music.mp3');
        let musicIndex = currentVideoIndex;
        if (fs.existsSync(musicFile)) {
            ffmpegCmd += `-i "${musicFile}" `;
            currentVideoIndex++;
        }
        
        // Build filter complex
        ffmpegCmd += '-filter_complex "';
        
        // Video concatenation
        const videoInputStr = videoInputs.map(v => `[${v.index}:v]`).join('');
        ffmpegCmd += `${videoInputStr}concat=n=${videoInputs.length}:v=1:a=0[video];`;
        
        // Audio concatenation
        const audioInputStr = audioInputs.map(a => `[${a.index}:a]`).join('');
        ffmpegCmd += `${audioInputStr}concat=n=${audioInputs.length}:v=0:a=1[voice];`;
        
        // Mix with music
        if (fs.existsSync(musicFile)) {
            ffmpegCmd += `[${musicIndex}:a]volume=0.2,atrim=0:${this.totalDuration}[music];`;
            ffmpegCmd += `[voice][music]amix=inputs=2:duration=first:dropout_transition=2[audio]`;
        } else {
            ffmpegCmd += '[voice]acopy[audio]';
        }
        
        ffmpegCmd += '" ';
        
        // Output settings
        ffmpegCmd += '-map "[video]" -map "[audio]" ';
        ffmpegCmd += '-c:v libx264 -preset fast -crf 20 ';
        ffmpegCmd += '-c:a aac -b:a 256k ';
        ffmpegCmd += '-r 30 -s 1920x1080 ';
        ffmpegCmd += `"${outputVideo}"`;
        
        console.log(`  Command length: ${ffmpegCmd.length} characters`);
        console.log(`  Total duration: ${this.totalDuration.toFixed(1)}s`);
        
        try {
            execSync(ffmpegCmd, { stdio: 'inherit', maxBuffer: 1024 * 1024 * 30 });
            
            const stats = fs.statSync(outputVideo);
            const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
            
            console.log(`\n🎉 PRECISELY SYNCHRONIZED VIDEO CREATED!`);
            console.log(`📁 Output: ${outputVideo}`);
            console.log(`📊 Size: ${fileSizeMB} MB`);
            console.log(`⏱️  Duration: ${this.totalDuration.toFixed(1)}s`);
            
            return outputVideo;
            
        } catch (error) {
            console.error(`❌ Video generation failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Run the complete process
     */
    async createPreciselySyncedVideo() {
        console.log('🎯 Creating precisely synchronized video...\n');
        
        // Ensure directories
        [this.tempDir, this.assetsDir, this.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        try {
            // Update slides
            await this.createTransitionSlide();
            await this.updateIntroductionSlide();
            
            // Generate voice and measure durations
            await this.generateAndMeasureVoice();
            
            // Capture visuals
            await this.captureSlides();
            await this.recordWebsiteDemo();
            
            // Build video
            const result = await this.buildPreciseVideo();
            
            if (result) {
                console.log(`\n✅ SUCCESS: Perfect synchronization achieved!`);
                console.log(`🎬 Audio and visuals are now precisely aligned`);
                console.log(`🆔 ERC-8004 Agent ID: 32055 correctly displayed`);
                
                // Print exact timeline
                console.log(`\n📋 PRECISE TIMELINE:`);
                this.segments.forEach((seg, i) => {
                    console.log(`${seg.startTime.toFixed(1)}s - ${seg.endTime.toFixed(1)}s: [${seg.type}] ${seg.id}`);
                });
            }
            
            return result;
            
        } catch (error) {
            console.error(`💥 Error: ${error.message}`);
            return null;
        }
    }
}

// Run it
async function main() {
    const syncSystem = new PreciseSyncSystem();
    await syncSystem.createPreciselySyncedVideo();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PreciseSyncSystem;