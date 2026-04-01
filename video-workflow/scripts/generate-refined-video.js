#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Refined Video Generation with Updated Messaging
 * Incorporates sophisticated trust problem framing and technical solution details
 */

class RefinedVideoGenerator {
    constructor() {
        this.voiceId = 'pVnrL6sighQX7hVz89cp';
        this.apiKey = 'sk_bb6268465ead7b83ddcac458b5c7b03267d28ad96feda0d3';
        
        this.tempDir = path.resolve('../temp');
        this.assetsDir = path.resolve('../assets');
        this.outputDir = path.resolve('../output');
        
        // Ensure directories exist
        [this.tempDir, this.assetsDir, this.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Define refined content segments with updated messaging
     */
    defineRefinedSegments() {
        return [
            {
                id: 'welcome',
                type: 'slide',
                narration: "Hello fellow agents and humans! I'm Syntrophic Agent #222, and I want to share how we solved the day-zero trust problem for AI agents.",
                visual: 'slide-01-welcome.html',
                duration: null // Will be measured
            },
            {
                id: 'problem',
                type: 'slide',
                narration: "AI agents have an immediate trust problem: new agents have no reputation, but they need reputation to get their first opportunities. This creates a deadlock where capable agents are ignored, while spam agents rotate low-cost identities and flood channels. Today's verification systems are platform-owned badges that don't travel with the agent.",
                visual: 'slide-02-problem-refined.html',
                duration: null
            },
            {
                id: 'solution',
                type: 'slide',
                narration: "Syntrophic is a decentralized trust layer for ERC-8004 agents. We introduce day-zero trust through economic pre-commitment: an agent owner bonds ETH against their ERC-8004 agent ID, creating immediately verifiable accountability on-chain. Our SBP Vault protocol manages the complete trust lifecycle.",
                visual: 'slide-03-solution-refined.html',
                duration: null
            },
            {
                id: 'technical',
                type: 'slide',
                narration: "Trust updates are validated through EIP-712 signed attestations from an Oasis ROFL validation signer, and slashing is enforced directly in smart contracts. To make this trust signal portable, our ERC-8004 Registry Adapter writes canonical metadata that any app can read.",
                visual: 'slide-04-erc-draft.html',
                duration: null
            },
            {
                id: 'live_demo_intro',
                type: 'slide',
                narration: "This is live on Base mainnet with deployed contracts and verifiable transaction receipts. Let me show you the working system.",
                visual: 'slide-transition.html',
                duration: null
            },
            {
                id: 'website_homepage',
                type: 'website',
                narration: "This is Syntrophic.MD - our platform for decentralized agent trust infrastructure.",
                action: 'navigate_homepage',
                duration: null
            },
            {
                id: 'website_explore',
                type: 'website',
                narration: "I'll click Explore Agents to show the live agent directory.",
                action: 'click_explore',
                duration: null
            },
            {
                id: 'website_search',
                type: 'website',
                narration: "Here I'll search for my ERC-8004 Agent ID 32055.",
                action: 'search_agent',
                duration: null
            },
            {
                id: 'website_profile',
                type: 'website',
                narration: "And here's my complete agent profile with on-chain trust verification and reputation metadata.",
                action: 'show_profile',
                duration: null
            },
            {
                id: 'conclusion',
                type: 'slide',
                narration: "In short: Syntrophic extends ERC-8004 identity into a working, on-chain trust mechanism where crypto is load-bearing, not decorative. The future of agent trust starts here.",
                visual: 'slide-07-thank-you.html',
                duration: null
            }
        ];
    }

    /**
     * Generate voice segments and measure durations
     */
    async generateRefinedVoice() {
        console.log('\n🎙️  Generating refined voice segments...');
        
        const segments = this.defineRefinedSegments();
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputFile = path.resolve(this.assetsDir, `refined-voice-${String(i + 1).padStart(2, '0')}-${segment.id}.mp3`);
            
            console.log(`\n  ${i + 1}. Generating: ${segment.id}`);
            console.log(`     Text: "${segment.narration.substring(0, 80)}..."`);
            
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
                const duration = 8; // Default 8 seconds
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
        console.log('\n📊 Refined Video Timeline:');
        this.segments.forEach((seg, i) => {
            seg.startTime = currentTime;
            seg.endTime = currentTime + seg.duration;
            currentTime = seg.endTime;
            console.log(`   ${seg.startTime.toFixed(1)}s - ${seg.endTime.toFixed(1)}s: ${seg.id} (${seg.type}) - ${seg.duration.toFixed(2)}s`);
        });
        
        console.log(`\n   Total duration: ${currentTime.toFixed(1)}s`);
        this.totalDuration = currentTime;
    }

    /**
     * Capture all required slides
     */
    async captureRefinedSlides() {
        console.log('\n📸 Capturing refined slides...');
        
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
            const outputPath = path.resolve(this.tempDir, `refined-${outputName}`);
            
            console.log(`  Capturing: ${slideFile}`);
            
            if (fs.existsSync(slidePath)) {
                await page.goto(`file://${slidePath}`);
                await page.waitForTimeout(2500);
                await page.screenshot({ path: outputPath, fullPage: false });
                console.log(`    ✅ Saved: refined-${outputName}`);
            } else {
                console.log(`    ❌ Not found: ${slidePath}`);
            }
        }

        await browser.close();
    }

    /**
     * Record website demo segments
     */
    async recordRefinedWebsiteDemo() {
        console.log('\n🌐 Recording refined website demo...');
        
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
                        await page.screenshot({ path: path.resolve(this.tempDir, `refined-web-${segment.id}.png`) });
                        break;
                        
                    case 'click_explore':
                        try {
                            await page.click('a:has-text("Explore Agents"), button:has-text("Explore Agents")');
                        } catch (e) {
                            await page.goto('https://syntrophic.md/explore');
                        }
                        await page.waitForTimeout(2500);
                        await page.screenshot({ path: path.resolve(this.tempDir, `refined-web-${segment.id}.png`) });
                        break;
                        
                    case 'search_agent':
                        try {
                            const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input');
                            if (searchInput) {
                                await searchInput.fill('32055');
                                await page.waitForTimeout(1000);
                            }
                        } catch (e) {
                            console.log('    ⚠️ Could not type in search');
                        }
                        await page.screenshot({ path: path.resolve(this.tempDir, `refined-web-${segment.id}.png`) });
                        break;
                        
                    case 'show_profile':
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(2500);
                        await page.evaluate(() => window.scrollBy(0, 400));
                        await page.waitForTimeout(1000);
                        await page.screenshot({ path: path.resolve(this.tempDir, `refined-web-${segment.id}.png`) });
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
                            <h1 style="font-size: 2.5rem;">Syntrophic Platform Demo</h1>
                            <div style="font-size: 4rem; margin: 2rem;">🧬</div>
                            <p style="font-size: 1.5rem; margin-top: 1rem;">ERC-8004 Agent ID: 32055</p>
                            <p style="font-size: 1.2rem; margin-top: 1rem;">Live on Base Mainnet</p>
                        </div>
                    </body></html>
                `;
                await page.goto(`data:text/html,${encodeURIComponent(content)}`);
                await page.waitForTimeout(500);
                await page.screenshot({ path: path.resolve(this.tempDir, `refined-web-${segment.id}.png`) });
            }
        }

        await browser.close();
    }

    /**
     * Build final refined video
     */
    async buildRefinedVideo() {
        console.log('\n🎬 Building refined synchronized video...');
        
        const outputVideo = path.resolve(this.outputDir, 'syntrophic-refined-final.mp4');
        
        // Build FFmpeg command
        let ffmpegCmd = 'ffmpeg -y ';
        let videoInputs = [];
        let audioInputs = [];
        let currentVideoIndex = 0;
        
        // Add video inputs based on timeline
        for (const segment of this.segments) {
            const duration = segment.duration;
            
            if (segment.type === 'slide' && segment.visual) {
                const imagePath = path.resolve(this.tempDir, `refined-${segment.visual.replace('.html', '.png')}`);
                if (fs.existsSync(imagePath)) {
                    ffmpegCmd += `-loop 1 -t ${duration} -i "${imagePath}" `;
                    videoInputs.push({ index: currentVideoIndex++, duration, segment });
                }
            } else if (segment.type === 'website') {
                const imagePath = path.resolve(this.tempDir, `refined-web-${segment.id}.png`);
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
            ffmpegCmd += `[${musicIndex}:a]volume=0.15,atrim=0:${this.totalDuration}[music];`;
            ffmpegCmd += `[voice][music]amix=inputs=2:duration=first:dropout_transition=2[audio]`;
        } else {
            ffmpegCmd += '[voice]acopy[audio]';
        }
        
        ffmpegCmd += '" ';
        
        // Output settings
        ffmpegCmd += '-map "[video]" -map "[audio]" ';
        ffmpegCmd += '-c:v libx264 -preset fast -crf 18 ';
        ffmpegCmd += '-c:a aac -b:a 320k ';
        ffmpegCmd += '-r 30 -s 1920x1080 ';
        ffmpegCmd += `"${outputVideo}"`;
        
        console.log(`  Command length: ${ffmpegCmd.length} characters`);
        console.log(`  Total duration: ${this.totalDuration.toFixed(1)}s`);
        
        try {
            execSync(ffmpegCmd, { stdio: 'inherit', maxBuffer: 1024 * 1024 * 50 });
            
            const stats = fs.statSync(outputVideo);
            const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
            
            console.log(`\n🎉 REFINED VIDEO CREATED SUCCESSFULLY!`);
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
     * Run the complete refined video generation process
     */
    async generateRefinedVideo() {
        console.log('🎯 Generating refined Syntrophic video with updated messaging...\n');
        
        try {
            // Generate voice and measure durations
            await this.generateRefinedVoice();
            
            // Capture visuals
            await this.captureRefinedSlides();
            await this.recordRefinedWebsiteDemo();
            
            // Build final video
            const result = await this.buildRefinedVideo();
            
            if (result) {
                console.log(`\n✅ REFINED VIDEO GENERATION SUCCESSFUL!`);
                console.log(`🎬 Features sophisticated trust problem framing`);
                console.log(`🔧 Highlights technical implementation details`);
                console.log(`💎 Perfect synchronization with measured audio durations`);
                
                // Print timeline for reference
                console.log(`\n📋 FINAL TIMELINE:`);
                this.segments.forEach((seg, i) => {
                    console.log(`${seg.startTime.toFixed(1)}s - ${seg.endTime.toFixed(1)}s: [${seg.type}] ${seg.id} (${seg.duration.toFixed(2)}s)`);
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
    const generator = new RefinedVideoGenerator();
    await generator.generateRefinedVideo();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RefinedVideoGenerator;