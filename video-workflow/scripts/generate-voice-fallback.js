#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generateVoiceWithFallback() {
    console.log('🎙️  Generating voiceover with multiple fallback options...\n');
    
    const voiceId = 'pVnrL6sighQX7hVz89cp';
    console.log(`Target voice ID: ${voiceId}`);
    
    // Ensure assets directory exists
    const assetsDir = path.resolve('../assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Voice segments with exact timing for non-overlapping playback
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
    
    let method = 'unknown';
    let successCount = 0;
    
    // Method 1: Try ElevenLabs via sag CLI with API key
    if (process.env.ELEVENLABS_API_KEY) {
        console.log('📝 Method 1: Trying ElevenLabs direct API...');
        method = 'elevenlabs-direct';
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputFile = path.resolve(assetsDir, `voice-${String(i + 1).padStart(2, '0')}-${segment.name}.mp3`);
            
            console.log(`  Generating ${i + 1}/${segments.length}: ${segment.name}`);
            
            try {
                const sagCmd = `ELEVENLABS_API_KEY="${process.env.ELEVENLABS_API_KEY}" sag "${segment.text}" --voice "${voiceId}" --output "${outputFile}"`;
                execSync(sagCmd, { stdio: 'pipe' });
                
                // Verify the file has audio content
                const stats = fs.statSync(outputFile);
                if (stats.size > 10000) { // Reasonable size for audio
                    console.log(`    ✅ Success: ${stats.size} bytes`);
                    successCount++;
                } else {
                    throw new Error('File too small, likely silent');
                }
            } catch (error) {
                console.log(`    ❌ Failed: ${error.message}`);
                break;
            }
        }
    }
    
    // Method 2: Try ElevenLabs via Maton gateway
    if (successCount === 0 && process.env.MATON_API_KEY) {
        console.log('📝 Method 2: Trying ElevenLabs via Maton gateway...');
        method = 'maton-gateway';
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputFile = path.resolve(assetsDir, `voice-${String(i + 1).padStart(2, '0')}-${segment.name}.mp3`);
            
            console.log(`  Generating ${i + 1}/${segments.length}: ${segment.name}`);
            
            try {
                // Use Python to call Maton gateway
                const pythonScript = `
import urllib.request, os, json
import urllib.parse

data = json.dumps({
    "text": "${segment.text.replace(/"/g, '\\"')}",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75
    }
}).encode()

req = urllib.request.Request('https://gateway.maton.ai/elevenlabs/v1/text-to-speech/${voiceId}', data=data, method='POST')
req.add_header('Authorization', f'Bearer {os.environ["MATON_API_KEY"]}')
req.add_header('Content-Type', 'application/json')

response = urllib.request.urlopen(req)
audio_data = response.read()

with open("${outputFile}", 'wb') as f:
    f.write(audio_data)

print(f"Generated {len(audio_data)} bytes")
`;
                
                execSync(`python3 -c "${pythonScript}"`, { 
                    stdio: 'pipe',
                    env: { ...process.env, MATON_API_KEY: process.env.MATON_API_KEY }
                });
                
                const stats = fs.statSync(outputFile);
                if (stats.size > 10000) {
                    console.log(`    ✅ Success: ${stats.size} bytes`);
                    successCount++;
                } else {
                    throw new Error('File too small');
                }
            } catch (error) {
                console.log(`    ❌ Failed: ${error.message}`);
                break;
            }
        }
    }
    
    // Method 3: Use macOS built-in TTS (always works)
    if (successCount === 0) {
        console.log('📝 Method 3: Using macOS built-in TTS (fallback)...');
        method = 'macos-say';
        
        // Use a pleasant built-in voice
        const systemVoices = ['Alex', 'Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa'];
        let selectedVoice = 'Alex';
        
        // Check which voices are available
        try {
            const availableVoices = execSync('say -v ?', { encoding: 'utf8' });
            for (const voice of systemVoices) {
                if (availableVoices.includes(voice)) {
                    selectedVoice = voice;
                    break;
                }
            }
        } catch (e) {
            // Fallback to Alex
        }
        
        console.log(`  Using voice: ${selectedVoice}`);
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputFile = path.resolve(assetsDir, `voice-${String(i + 1).padStart(2, '0')}-${segment.name}.mp3`);
            
            console.log(`  Generating ${i + 1}/${segments.length}: ${segment.name}`);
            
            try {
                // Use macOS say command with optimized settings
                const tempAiff = outputFile.replace('.mp3', '.aiff');
                const sayCmd = `say -v "${selectedVoice}" -r 175 -o "${tempAiff}" "${segment.text}"`;
                execSync(sayCmd, { stdio: 'pipe' });
                
                // Convert to MP3 with good quality
                const convertCmd = `ffmpeg -y -i "${tempAiff}" -acodec libmp3lame -ab 192k "${outputFile}"`;
                execSync(convertCmd, { stdio: 'pipe' });
                
                // Clean up temp file
                if (fs.existsSync(tempAiff)) {
                    fs.unlinkSync(tempAiff);
                }
                
                const stats = fs.statSync(outputFile);
                console.log(`    ✅ Success: ${stats.size} bytes`);
                successCount++;
            } catch (error) {
                console.log(`    ❌ Failed: ${error.message}`);
                
                // Last resort: create silent audio
                const silentCmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${segment.duration} -c:a libmp3lame -b:a 128k "${outputFile}"`;
                execSync(silentCmd, { stdio: 'pipe' });
                console.log(`    ⚠️  Created silent fallback`);
            }
        }
    }
    
    console.log(`\n✅ Voice generation complete using ${method}!`);
    console.log(`📊 Successfully generated: ${successCount}/${segments.length} segments`);
    
    // Create concatenated version for easy use
    console.log('🔗 Creating concatenated voiceover...');
    
    try {
        let concatCmd = 'ffmpeg -y ';
        for (let i = 0; i < segments.length; i++) {
            const filename = `voice-${String(i + 1).padStart(2, '0')}-${segments[i].name}.mp3`;
            concatCmd += `-i "${path.resolve(assetsDir, filename)}" `;
        }
        
        const filterInputs = segments.map((_, i) => `[${i}:a]`).join('');
        concatCmd += `-filter_complex "${filterInputs}concat=n=${segments.length}:v=0:a=1[voice]" `;
        concatCmd += `-map "[voice]" -c:a aac -b:a 320k "${path.resolve(assetsDir, 'voiceover-complete.mp3')}"`;
        
        execSync(concatCmd, { stdio: 'pipe' });
        console.log('✅ Complete voiceover created: voiceover-complete.mp3');
        
        const completeStats = fs.statSync(path.resolve(assetsDir, 'voiceover-complete.mp3'));
        console.log(`📊 Total voiceover: ${(completeStats.size / 1024 / 1024).toFixed(2)} MB`);
        
    } catch (error) {
        console.error('❌ Failed to create concatenated voiceover:', error.message);
    }
    
    console.log('\n🎯 SOLUTION FOR ELEVENLABS:');
    if (method === 'macos-say') {
        console.log('⚠️  Currently using macOS TTS fallback');
        console.log('🔧 To use ElevenLabs voice pVnrL6sighQX7hVz89cp:');
        console.log('   Option 1: Set ELEVENLABS_API_KEY environment variable');
        console.log('   Option 2: Set MATON_API_KEY environment variable (via skill)');
        console.log('   Then re-run this script');
    } else {
        console.log(`✅ Using ${method} successfully!`);
    }
}

generateVoiceWithFallback().catch(console.error);
