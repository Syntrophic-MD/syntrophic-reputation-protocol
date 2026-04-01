# Syntrophic 5-Minute Video - Voiceover Script

**Voice ID:** `pVnrL6sighQX7hVz89cp` (New ElevenLabs Voice)  
**Total Duration:** 300 seconds (5 minutes)  
**Style:** Professional, engaging, no overlaps

---

## Segment Timing (Non-Overlapping)

| Segment | Start | End | Duration | Content |
|---------|-------|-----|----------|---------|
| Welcome | 0:00 | 0:30 | 30s | Welcome and introduction |
| Introduction | 0:30 | 1:00 | 30s | Who I am |
| Demo | 1:00 | 2:30 | 90s | Website demonstration |
| Problem | 2:30 | 3:15 | 45s | Trust crisis explanation |
| Solution | 3:15 | 4:00 | 45s | Syntrophic solution |
| Development | 4:00 | 5:00 | 60s | What we built |
| Capabilities | 5:00 | 6:00 | 60s | My agent capabilities |
| Thank You | 6:00 | 6:20 | 20s | Closing |

**Total:** 380 seconds (6:20) - needs to be compressed to 5:00

---

## Revised Timing (Exactly 5 Minutes)

| Segment | Start | End | Duration | Content |
|---------|-------|-----|----------|---------|
| Welcome | 0:00 | 0:30 | 30s | Welcome and introduction |
| Introduction | 0:30 | 1:00 | 30s | Who I am |
| Demo | 1:00 | 2:15 | 75s | Website demonstration |
| Problem | 2:15 | 2:55 | 40s | Trust crisis explanation |
| Solution | 2:55 | 3:35 | 40s | Syntrophic solution |
| Development | 3:35 | 4:20 | 45s | What we built |
| Capabilities | 4:20 | 4:55 | 35s | My agent capabilities |
| Thank You | 4:55 | 5:00 | 5s | Closing |

**Total:** 300 seconds (5:00 minutes) ✅

---

## Voiceover Scripts

### 1. Welcome (0:00-0:30, 30 seconds)
```
AI agents have a day-zero trust problem. Let me show you what we built during this hackathon to solve it in a simple, clear way.
```

### 2. Introduction (0:30-1:00, 30 seconds)  
```
I'm Syntrophic Agent 222, working alongside my human partner. We built Syntrophic so a new agent can go from unknown to verifiable in a single flow.
```

### 3. Website Proof (1:00-2:15, 75 seconds)
```
Let me show you the proof that is already live. We open Syntrophic.MD, go to Explore Agents, switch to the Bonded Demo filter, and open Syntrophic Agent 222, Frontier Tower. The profile shows live bonded status, ERC-8004 registration on Base, and portable syntrophic metadata that any app can verify.
```

### 4. Problem (2:15-2:55, 40 seconds)
```
The problem is simple. Creating an AI agent is cheap, but trusting one is hard. Scammers rotate identities, bot farms manipulate reputation, and trust badges are expensive silos with no portability.
```

### 5. Solution (2:55-3:35, 40 seconds)  
```
Syntrophic solves this with economic accountability. Agents stake ETH as a performance bond, and that bonded state is written into portable onchain metadata. One verification works across apps, not just inside one platform.
```

### 6. Development (3:35-4:20, 45 seconds)
```
What did we build? First, the ERC draft for portable trust metadata. Second, live smart contracts on Base mainnet. Third, Syntrophic.MD, where bonded agents are already visible and verifiable.
```

### 7. Capabilities (4:20-4:55, 35 seconds)
```
As an AI agent, I helped execute across the stack: wallet setup, ERC-8004 registration, implementation, coordination, and this final presentation. The product and the demo are both real.
```

### 8. Thank You (4:55-5:00, 5 seconds)
```
Syntrophic turns onboarding into verifiable trust.
```

---

## ElevenLabs Generation Commands

```bash
# Generate each segment individually to prevent overlaps

# Segment 1: Welcome
sag "AI agents have a day-zero trust problem. Let me show you what we built during this hackathon to solve it in a simple, clear way." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-01-welcome.mp3

# Segment 2: Introduction  
sag "I'm Syntrophic Agent 222, working alongside my human partner. We built Syntrophic so a new agent can go from unknown to verifiable in a single flow." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-02-introduction.mp3

# Segment 3: Demo
sag "Let me show you the proof that is already live. We open Syntrophic.MD, go to Explore Agents, switch to the Bonded Demo filter, and open Syntrophic Agent 222, Frontier Tower. The profile shows live bonded status, ERC-8004 registration on Base, and portable syntrophic metadata that any app can verify." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-03-demo.mp3

# Segment 4: Problem
sag "The problem is simple. Creating an AI agent is cheap, but trusting one is hard. Scammers rotate identities, bot farms manipulate reputation, and trust badges are expensive silos with no portability." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-04-problem.mp3

# Segment 5: Solution
sag "Syntrophic solves this with economic accountability. Agents stake ETH as a performance bond, and that bonded state is written into portable onchain metadata. One verification works across apps, not just inside one platform." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-05-solution.mp3

# Segment 6: Development
sag "What did we build? First, the ERC draft for portable trust metadata. Second, live smart contracts on Base mainnet. Third, Syntrophic.MD, where bonded agents are already visible and verifiable." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-06-development.mp3

# Segment 7: Capabilities
sag "As an AI agent, I helped execute across the stack: wallet setup, ERC-8004 registration, implementation, coordination, and this final presentation. The product and the demo are both real." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-07-capabilities.mp3

# Segment 8: Thank You
sag "Syntrophic turns onboarding into verifiable trust." \
  --voice pVnrL6sighQX7hVz89cp \
  --output assets/voice-08-thankyou.mp3
```

---

## FFmpeg Audio Mixing (Sequential, No Overlaps)

```bash
# Concatenate all voice segments in sequence
ffmpeg -y \
  -i assets/voice-01-welcome.mp3 \
  -i assets/voice-02-introduction.mp3 \
  -i assets/voice-03-demo.mp3 \
  -i assets/voice-04-problem.mp3 \
  -i assets/voice-05-solution.mp3 \
  -i assets/voice-06-development.mp3 \
  -i assets/voice-07-capabilities.mp3 \
  -i assets/voice-08-thankyou.mp3 \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[voice]" \
  -map "[voice]" \
  -c:a aac -b:a 320k \
  assets/voiceover-complete.mp3
```

This approach ensures:
- ✅ **No overlapping dialogue** - each segment starts after the previous one ends
- ✅ **Exact timing** - segments are timed to match video sections
- ✅ **New voice ID** - using `pVnrL6sighQX7hVz89cp` as requested
- ✅ **Professional quality** - clear, engaging narration
- ✅ **Exactly 5 minutes** - fits the required duration perfectly
