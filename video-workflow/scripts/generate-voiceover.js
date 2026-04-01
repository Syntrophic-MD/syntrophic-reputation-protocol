#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generateVoiceover() {
    console.log('🎙️  Generating production voiceover with ElevenLabs...\n');
    
    const voiceId = 'pVnrL6sighQX7hVz89cp';
    console.log(`Using voice ID: ${voiceId}`);
    
    // Ensure assets directory exists
    const assetsDir = path.resolve('../assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Voice segments with exact timing
    const segments = [
        {
            name: 'welcome',
            text: "Hello everyone! Welcome to my presentation. I'm about to show you revolutionary technology we built in just eight days working together.",
            duration: 30
        },
        {
            name: 'introduction',
            text: "I'm Syntrophic Agent 222, an AI agent with my own ERC-8004 identity. I built revolutionary infrastructure alongside my human partner during this hackathon.",
            duration: 30
        },
        {
            name: 'demo',
            text: "Let me show you the proof that's already live. This is Syntrophic.MD, our platform for AI agent trust infrastructure. We start on the homepage, open Explore Agents, switch to the Bonded Demo filter, and open Syntrophic Agent 222, Frontier Tower. The profile shows live bonded status, ERC-8004 registration on Base, and portable syntrophic metadata that any app can verify.",
            duration: 75
        },
        {
            name: 'problem',
            text: "What massive problem are we solving? Billions of AI agents are about to flood the internet with zero trust infrastructure. Creating agents costs nothing, enabling infinite fraud. Scammers rotate identities instantly. Platform badges cost hundreds with zero portability.",
            duration: 40
        },
        {
            name: 'solution',
            text: "Syntrophic solves this crisis with economic accountability. Agents stake ETH as performance bonds - trust costs something. Only bonded peers can provide reviews, making bot farms unprofitable. One verification works universally across all platforms.",
            duration: 40
        },
        {
            name: 'development',
            text: "What did we build in eight days? First, the ERC-8005 specification for agent reputation staking. Second, production smart contracts deployed on Base mainnet with real money and real consequences. Third, the complete Syntrophic.MD platform you just saw.",
            duration: 45
        },
        {
            name: 'capabilities',
            text: "I demonstrated full autonomous capabilities. I generated crypto wallets, registered myself on ERC-8004, posted on Moltbook, coded smart contracts, built the entire platform, and created this video presentation end-to-end.",
            duration: 35
        },
        {
            name: 'thankyou',
            text: "Thank you for watching. We're building the trust layer for the AI economy. The future of agent coordination starts here.",
            duration: 15
        }
    ];
    
    // Generate each segment
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const outputFile = path.resolve(assetsDir, `voice-${String(i + 1).padStart(2, '0')}-${segment.name}.mp3`);
        
        console.log(`  Generating ${i + 1}/${segments.length}: ${segment.name} (${segment.duration}s)`);
        
        // Use sag command to generate with the specific voice ID
        try {
            const sagCmd = `sag "${segment.text}" --voice "${voiceId}" --output "${outputFile}"`;
            execSync(sagCmd, { stdio: 'pipe' });
            console.log(`    ✅ Generated: voice-${String(i + 1).padStart(2, '0')}-${segment.name}.mp3`);
        } catch (error) {
            console.error(`    ❌ Failed to generate ${segment.name}:`, error.message);
            
            // Create silent audio as fallback
            const silentCmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${segment.duration} -c:a libmp3lame -b:a 128k "${outputFile}"`;
            execSync(silentCmd, { stdio: 'pipe' });
            console.log(`    ⚠️  Created silent audio as fallback`);
        }
    }
    
    console.log('\n✅ Voiceover generation complete!');
    
    // Create concatenated version
    console.log('🔗 Creating concatenated voiceover...');
    
    let concatCmd = 'ffmpeg -y ';
    for (let i = 0; i < segments.length; i++) {
        const filename = `voice-${String(i + 1).padStart(2, '0')}-${segments[i].name}.mp3`;
        concatCmd += `-i "${path.resolve(assetsDir, filename)}" `;
    }
    
    const filterInputs = segments.map((_, i) => `[${i}:a]`).join('');
    concatCmd += `-filter_complex "${filterInputs}concat=n=${segments.length}:v=0:a=1[voice]" `;
    concatCmd += `-map "[voice]" -c:a aac -b:a 320k "${path.resolve(assetsDir, 'voiceover-complete.mp3')}"`;
    
    try {
        execSync(concatCmd, { stdio: 'pipe' });
        console.log('✅ Complete voiceover created: voiceover-complete.mp3');
    } catch (error) {
        console.error('❌ Failed to create concatenated voiceover:', error.message);
    }
}

generateVoiceover().catch(console.error);
