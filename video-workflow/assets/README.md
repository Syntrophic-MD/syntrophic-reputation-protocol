# Audio Assets Needed

Add these files to this folder:

## Required

### background-music.mp3
Background music track (lo-fi, ambient, or corporate)
- Duration: 30+ seconds (will loop if shorter)
- Volume: 0.4 (adjustable in config.json)
- Sources:
  - YouTube Audio Library (free)
  - Pixabay (free)
  - Epidemic Sound (paid)
  - Your own music

### voiceover.mp3
Ending voice narration
- Duration: ~5 seconds
- Text: "Syntrophic — Trust Before The Noise"
- Will play at timestamp 25s (configurable in config.json)

## Optional

### sfx/click.mp3
UI click sound effect

### sfx/whoosh.mp3
Transition whoosh sound

## Free Sources

1. **YouTube Audio Library** - https://studio.youtube.com/channel/audio
2. **Pixabay Music** - https://pixabay.com/music/
3. **Freesound** - https://freesound.org/
4. **Mixkit** - https://mixkit.co/free-sound-effects/

## Voiceover Tips

For the voiceover, you can:
2. Use ElevenLabs TTS (more realistic AI voices)
   Then convert: `ffmpeg -i voiceover.aiff voiceover.mp3`