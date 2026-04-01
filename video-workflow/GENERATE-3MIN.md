# Generate The Quick Site Demo

## Run

```bash
cd /Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/scripts
npm run build
```

Preview the scene order first:

```bash
npm run dry-run
```

## What It Creates

A quick site-only presentation video using:

1. opening slides
2. `https://www.syntrophic.md`
3. `https://www.syntrophic.md/skill.md`
4. `https://www.syntrophic.md/onboard`
5. `https://www.syntrophic.md/agents/base/38344`
6. an on-chain proof summary card
7. closing slide

## Voice

Default ElevenLabs voice:

- `Frank`
- `lKf2tqVafNW1nVb7CgwC`

Override if needed:

```bash
export VIDEO_VOICE_ID="your_voice_id"
export VIDEO_VOICE_NAME="Your Voice"
```

## Requirements

- Node.js
- Playwright with Chromium
- FFmpeg
- optional `ELEVENLABS_API_KEY`

## Output

Generated file:

```text
/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/output/syntrophic-3min-presentation.mp4
```

## Notes

- The default flow does not record any terminal.
- The generator pads and concatenates scene audio sequentially to avoid overlapping voice segments.
- Keep the narration aligned with the markdown files in [video-workflow/input](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/input).
