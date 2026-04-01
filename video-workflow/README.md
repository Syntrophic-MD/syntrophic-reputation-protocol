# Syntrophic Video Workflow

This folder now defaults to a quick, site-only demo video.

The canonical flow is:

1. opening slides
2. homepage prompt dialog
3. public skill at `https://syntrophic.md/skill.md`
4. `/onboard` quote creation demo
5. live verification page
6. on-chain proof summary card
7. closing slide

No terminal recording is required in the default path.

## Default Generator

From [video-workflow/scripts](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/scripts):

```bash
npm run build
```

This runs [generate-3min-presentation.js](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/scripts/generate-3min-presentation.js) through [run-all.js](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/scripts/run-all.js).

Useful variants:

```bash
npm run dry-run
npm run quick
```

## Voice

The default ElevenLabs voice is:

- `Frank`
- voice id `lKf2tqVafNW1nVb7CgwC`

You can override it with:

```bash
export VIDEO_VOICE_ID="your_voice_id"
export VIDEO_VOICE_NAME="Your Voice"
```

The generator looks for `ELEVENLABS_API_KEY` first, then checks the macOS keychain. If ElevenLabs is unavailable, it falls back to macOS `say`.

## Output

Final video:

- [syntrophic-3min-presentation.mp4](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/output/syntrophic-3min-presentation.mp4)

Intermediate artifacts:

- [video-workflow/temp](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/temp)

## Source Of Truth

Narration and sequencing should stay aligned with:

- [HACKATHON_3MIN_VOICEOVER_SCRIPT.md](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/input/HACKATHON_3MIN_VOICEOVER_SCRIPT.md)
- [HACKATHON_3MIN_DEMO_RUNBOOK.md](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/input/HACKATHON_3MIN_DEMO_RUNBOOK.md)
- [HACKATHON_JUDGE_SLIDES.md](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/input/HACKATHON_JUDGE_SLIDES.md)
- [X402_DEMO_VIDEO_SEQUENCE.md](/Users/agentbook/code/syntrophic-reputation-protocol/video-workflow/input/X402_DEMO_VIDEO_SEQUENCE.md)

If those docs change, update the generator scenes before recording a new cut.
