# Syntrophic Video Workflow

Modular workflow for building the Syntrophic hackathon video.

Current best story for the final cut:

- show the homepage briefly
- open `Explore Agents`
- apply `Bonded (Demo)`
- open `Syntrophic Agent #222 — Frontier Tower`
- show `BONDED` status plus ERC-8004 and `syntrophic.*` metadata on Base

This is stronger than the older search-based demo because it films proof that is already live on `Syntrophic.MD`.

## Structure

```
video-workflow/
├── config.json           # All customizable parameters
├── scripts/
│   ├── 01-generate-slides.js    # Creates opening/closing slides
│   ├── 02-record-demo.js        # Captures website demo
│   ├── 03-compose-video.js      # Stitches everything together
│   └── run-all.js               # Orchestrates full workflow
├── assets/
│   ├── logo.png                 # Your logo
│   ├── background-music.mp3     # Background music
│   ├── voiceover.mp3            # Ending voice
│   └── sfx/                      # Sound effects
│       ├── click.mp3
│       └── whoosh.mp3
├── temp/                         # Intermediate files
└── output/                       # Final video
```

## Quick Start

```bash
# 1. Add your assets to assets/ folder
# 2. Edit config.json to customize
# 3. Run the full workflow
node scripts/run-all.js
```

## Individual Scripts

```bash
# Generate slides only
node scripts/01-generate-slides.js

# Record demo only
node scripts/02-record-demo.js

# Compose final video only
node scripts/03-compose-video.js
```

## Customization

### Change Website URL
Edit `config.json`:
```json
"demo": {
  "url": "https://your-website.com",
  "actions": [...]
}
```

### Change Slide Text
Edit `config.json`:
```json
"slides": {
  "opening": {
    "title": "Your Title",
    "subtitle": "Your Subtitle"
  }
}
```

### Adjust Timing
Edit `config.json`:
```json
"slides": {
  "opening": { "duration": 5 }
}
```

### Add More Demo Actions
Edit `config.json`:
```json
"demo": {
  "actions": [
    { "type": "click", "selector": "button", "wait_after": 2000 },
    { "type": "scroll", "direction": "down", "amount": 300 },
    { "type": "wait", "duration": 1000 }
  ]
}
```

## Requirements

- Node.js 18+
- Playwright (for demo recording)
- FFmpeg (for video composition)

### Install Dependencies
```bash
npm install playwright
npx playwright install chromium
brew install ffmpeg  # macOS
```

## Audio Assets

You'll need to provide:

1. **Background music** (`assets/music.mp3`)
   - Lo-fi, ambient, or corporate background track
   - Source: YouTube Audio Library, Pixabay, or your own

2. **Voiceover** (`assets/voiceover.mp3`)
   - Short ending narration (5-10 seconds)
   - "Syntrophic — Trust Before the Noise"

3. **Sound effects** (`assets/sfx/`)
   - `click.mp3` — UI click sound
   - `whoosh.mp3` — Transition whoosh

## Output

Final video saved to: `output/syntrophic-demo.mp4`

## Add Audio (Optional)

The video currently has no audio. To add:

1. **Background music:** Place `background-music.mp3` in `assets/`
2. **Voiceover:** Place `voiceover.mp3` in `assets/` (plays at25s)
3. **Sound effects:** Place `click.mp3` in `assets/sfx/`

Then re-run: `node scripts/run-all.js`

### Generate Voiceover with ElevenLabs

```bash
# Using your ElevenLabs API key
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Syntrophic. Trust Before the Noise.", "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}}' \
  --output assets/voiceover.mp3
```
