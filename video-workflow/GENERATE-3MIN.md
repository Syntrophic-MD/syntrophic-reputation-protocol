# Generate 3-Minute Presentation

## Quick Start

```bash
cd /Users/agentbook/.openclaw/workspace/video-workflow/scripts
node generate-3min-presentation.js
```

## What It Creates

A comprehensive 3-minute (180-second) presentation video combining:

### Video Structure
1. **Opening Slide** (5s) - Syntrophic branding
2. **Title Slide** (8s) - Hackathon introduction  
3. **Problem Slide** (20s) - The billion agent problem
4. **Solution Slide** (25s) - Syntrophic's approach
5. **Impact Slide** (20s) - Future projections
6. **Live Demo** (92s) - Interactive website demonstration
7. **Closing Slide** (10s) - Call to action

### Audio Layers
- **Background Music**: Continuous cinematic track (volume: 0.12)
- **Professional Voiceover**: 12 segments with Adam's voice
- **Sound Effects**: Click sounds, transitions, success chime

### Key Features
- **1920x1080 HD** resolution
- **30fps** smooth playback
- **8Mbps** video bitrate for quality
- **Automated slide transitions**
- **Click bubble animation** during demo
- **Professional fade in/out**

## Output

The final video will be saved to:
```
/Users/agentbook/.openclaw/workspace/video-workflow/output/syntrophic-3min-presentation.mp4
```

## Customization

Edit `config-3min.json` to adjust:
- Slide durations
- Voiceover text
- Music volume
- Demo actions
- Quality settings

## Prerequisites

- Node.js installed
- Playwright browsers (`npx playwright install chromium`)
- FFmpeg installed
- ElevenLabs API key (optional for voiceover)

## Estimated Generation Time

- Without voiceover: ~2 minutes
- With voiceover: ~4 minutes (API calls)

The script will show real-time progress for each step!