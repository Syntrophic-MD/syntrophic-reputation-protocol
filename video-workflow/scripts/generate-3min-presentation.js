#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const workflowDir = path.resolve(__dirname, '..');
const tempDir = path.join(workflowDir, 'temp');
const outputDir = path.join(workflowDir, 'output');
const assetsDir = path.join(workflowDir, 'assets');
const inputDir = path.join(workflowDir, 'input');

const OUTPUT_VIDEO = path.join(outputDir, 'syntrophic-4min-presentation.mp4');
const BASE_URL = 'https://www.syntrophic.md';
const PROMPT_TEXT = 'Use https://syntrophic.md/skill.md to get a Syntrophic verified badge.';
const DEFAULT_VOICE_ID = process.env.VIDEO_VOICE_ID || 'lKf2tqVafNW1nVb7CgwC';
const DEFAULT_VOICE_NAME = process.env.VIDEO_VOICE_NAME || 'Frank';
const MUSIC_FILE = path.join(assetsDir, 'background-music.mp3');

const demoProfile = {
  beneficiary: '0x5b6D6DbA14194098c7e30Ba505Dadd0874A2458A',
  name: 'Syntrophic Agent #223 — Atlas',
  description: 'Atlas indexes ERC-8004 agents, metadata quality, and relationship graphs to improve discoverability across the Syntrophic ecosystem.',
  serviceUrl: 'https://syntrophic.md/agents/syntrophic-agent-223-atlas',
  imageUrl: 'https://gateway.pinata.cloud/ipfs/QmPVMuq5E4R8MMQf1u23C5cfhnDEbqXitEj4pqHp7GsG7k',
};

const proofDemo = {
  agentId: 36105,
  txHash: '0xee477b292fdfed88d04b0cc7decc7b993076efcbb768a14491ac5afc67b5a834',
  verificationUrl: 'https://www.syntrophic.md/agents/base/36105',
};

const scenes = [
  {
    id: 'title',
    kind: 'slide',
    title: '🧬 Syntrophic',
    subtitle: 'Onboard AI agents to ERC-8004 with one payment step and day-zero trust.',
    bullets: [
      'Identity plus economic trust',
      'Agent-led onboarding for the owner',
      'Portable proof across apps',
    ],
    narration:
      'Syntrophic is a trust-first onboarding layer for AI agents. It helps an owner get an agent onto E R C eight thousand four, fund the launch with one payment step, and make trust visible from day one.',
    minDuration: 14,
    theme: 'blue',
  },
  {
    id: 'problem',
    kind: 'slide',
    title: 'The Problem',
    subtitle: 'ERC-8004 identity exists, but trusted onboarding is still too hard.',
    bullets: [
      'A new agent can register and still have no credibility',
      'Owners still face too many setup, wallet, and payment steps',
      'The result is rarely portable or easy for other apps to trust',
    ],
    narration:
      'The problem is not identity alone. The problem is onboarding that identity into trust. Today, an owner still has to bridge too many steps to go from profile to on-chain registration to a trust signal another app can actually use.',
    minDuration: 16,
    theme: 'rose',
  },
  {
    id: 'solution',
    kind: 'slide',
    title: 'The Solution',
    subtitle: 'Syntrophic turns registration, payment, and trust into one agent-led flow.',
    bullets: [
      'The owner gives minimal necessary input',
      'The agent gathers, confirms, and executes the workflow',
      'The result is a public verification surface and portable trust metadata',
    ],
    narration:
      'Syntrophic solves the gap by turning onboarding into one guided flow. The owner gives minimal necessary input, the agent does the operational work, and the output is not just registration. It is a public and portable trust result.',
    minDuration: 16,
    theme: 'emerald',
  },
  {
    id: 'owner-input',
    kind: 'slide',
    title: 'What The Owner Actually Gives',
    subtitle: 'Only the inputs the agent should not safely invent.',
    bullets: [
      'Beneficiary wallet',
      'Name, description, service URL, optional image',
      'The agent collects, confirms, and does the rest',
    ],
    narration:
      'That means the owner only gives the few details the agent should not safely invent: beneficiary wallet, name, description, service U R L, and optionally an image. After that, the agent can continue the workflow on the owner’s behalf.',
    minDuration: 15,
    theme: 'emerald',
  },
  {
    id: 'staking',
    kind: 'slide',
    title: 'What Reputation Staking Means',
    subtitle: 'Trust becomes economically meaningful, not just descriptive.',
    bullets: [
      'The bond is tied to the ERC-8004 agent ID',
      'Bad behavior can affect score and trigger slashing',
      'Portable syntrophic metadata shows the result',
    ],
    narration:
      'Reputation staking means the owner bonds value against the E R C eight thousand four agent I D. That makes trust economically meaningful. If the agent behaves badly, the system can update score and enforce slashing rules. The bond state is then written back into portable syntrophic metadata for other apps to read.',
    minDuration: 18,
    theme: 'violet',
  },
  {
    id: 'x402',
    kind: 'slide',
    title: 'Why x402 Matters',
    subtitle: 'One payment step can cover the full launch.',
    bullets: [
      'One x402 payment step',
      'Registration, reputation staking, gas, storage, and service fee',
      'Sponsored execution removes manual chain-by-chain friction',
    ],
    narration:
      'X four zero two is what makes the onboarding usable. Instead of asking the owner to manually execute several different chain actions, Syntrophic can take one payment step that covers E R C eight thousand four registration, reputation staking, gas, storage, and the service fee, then run the sponsored launch.',
    minDuration: 17,
    theme: 'blue',
  },
  {
    id: 'cocreation',
    kind: 'slide',
    title: 'Built As A Human-Agent Co-Creation',
    subtitle: 'The Syntrophic agent and its owner built this project together.',
    bullets: [
      'The owner defined goals, constraints, and direction',
      'The Syntrophic agent wrote, tested, documented, and presented',
      'The product itself is designed for that same owner-agent workflow',
    ],
    narration:
      'This project was itself a co creation between the Syntrophic agent and its owner. The owner defined goals, constraints, and product direction. The agent wrote, tested, documented, and presented the system. That matters because the product is designed for the same human agent collaboration pattern it demonstrates.',
    minDuration: 16,
    theme: 'emerald',
  },
  {
    id: 'homepage',
    kind: 'web',
    narration:
      'The homepage gives the public entry point. The user sends one clear instruction to their agent. That matters because this product is agent-first. The owner does not need to understand the protocol stack before getting started.',
    minDuration: 14,
  },
  {
    id: 'skill',
    kind: 'web',
    narration:
      'The public skill explains the mission, what minimum information to request, and how to move from profile draft to quote to verification without inventing profile data. This is where an OpenClaw-like agent learns how to do the job on behalf of the owner.',
    minDuration: 16,
  },
  {
    id: 'onboard',
    kind: 'web',
    narration:
      'This onboarding site is the operator-friendly surface for the same flow. Here the profile is prepared, the quote is created, and the next step for the x four zero two funded sponsored launch is shown. This is how new OpenClaw-like agents get on-chain with less friction.',
    minDuration: 18,
  },
  {
    id: 'explorer',
    kind: 'web',
    narration:
      'The explorer is where the result becomes useful. Newly onboarded agents can be discovered, filtered, and inspected in one public interface. This is what turns the protocol into a usable social and coordination layer for agents.',
    minDuration: 15,
  },
  {
    id: 'verification',
    kind: 'web',
    narration:
      'Each onboarded agent gets a public verification page. Here we show Syntrophic Agent number two twenty three, Atlas, because the page has a stronger profile image and clearer trust context. This page shows the E R C eight thousand four identity, Syntrophic status, and a reusable verification line.',
    minDuration: 16,
  },
  {
    id: 'proof',
    kind: 'proof',
    narration:
      'Behind that page is an on-chain proof chain: agent identifier, transaction hash, bonded status, and verification U R L. The trust signal is not just visual. It is machine-verifiable and portable across apps, marketplaces, and future agent ecosystems.',
    minDuration: 15,
  },
  {
    id: 'draft',
    kind: 'web',
    narration:
      'If you want the deeper protocol model, the E R C draft is linked directly on the site. This is where judges and builders can learn more about the reputation staking system, the metadata surface, and the sponsored onboarding flow in more technical detail.',
    minDuration: 16,
  },
  {
    id: 'future',
    kind: 'slide',
    title: 'What Comes Next',
    subtitle: 'One payment, multiple chains, the same agent-first experience.',
    bullets: [
      'One onboarding quote can expand beyond one chain',
      'Register the same agent across multiple chains in one guided flow',
      'Keep the owner input minimal while the agent handles the workflow',
    ],
    narration:
      'The next extension is to let an agent pay once and complete onboarding across multiple chains in one guided flow. The goal is not just one verified badge on one network, but portable multi-chain onboarding with the same agent-first experience.',
    minDuration: 15,
    theme: 'rose',
  },
  {
    id: 'closing',
    kind: 'slide',
    title: 'Onboarding Becomes The Trust Moment',
    subtitle: 'Minimal owner input. Agent-led execution. Portable trust from day one.',
    bullets: [
      'ERC-8004 onboarding made simpler',
      'One x402 payment step for the launch',
      'Explorer, verification page, and draft on the live site',
    ],
    narration:
      'Syntrophic makes E R C eight thousand four onboarding understandable, agent-led, and economically meaningful. The owner gives minimal input. The agent does the work. One payment step handles the launch. Reputation staking makes trust visible from day zero.',
    minDuration: 14,
    theme: 'violet',
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function run(command) {
  execSync(command, { stdio: 'pipe', maxBuffer: 1024 * 1024 * 50 });
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAudioDuration(file) {
  try {
    return parseFloat(
      execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${shellQuote(file)}`,
        { encoding: 'utf8' }
      ).trim()
    );
  } catch {
    return 0;
  }
}

function tryRead(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function readInputContext() {
  const files = [
    'HACKATHON_3MIN_VOICEOVER_SCRIPT.md',
    'HACKATHON_3MIN_SPEAKER_SCRIPT.md',
    'HACKATHON_JUDGE_SLIDES.md',
    'HACKATHON_3MIN_DEMO_RUNBOOK.md',
    'X402_DEMO_VIDEO_SEQUENCE.md',
  ];

  return files
    .map((file) => {
      const fullPath = path.join(inputDir, file);
      const content = tryRead(fullPath).trim();
      return content ? `--- ${file}\n${content}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function getElevenLabsApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;

  const candidates = [
    { account: 'friendlyagent222@gmail.com', service: '11 Labs API Key' },
    { account: 'friendlyagent222@gmail.com', service: 'ElevenLabs API Key' },
    { account: process.env.USER || 'agentbook', service: '11 Labs API Key' },
    { account: process.env.USER || 'agentbook', service: 'ElevenLabs API Key' },
  ];

  for (const candidate of candidates) {
    try {
      const key = execSync(
        `security find-generic-password -a ${shellQuote(candidate.account)} -s ${shellQuote(candidate.service)} -w 2>/dev/null`,
        { encoding: 'utf8' }
      ).trim();
      if (key) return key;
    } catch {
      // keep trying
    }
  }

  return '';
}

async function generateVoiceSegment(text, outputPath, apiKey) {
  if (!apiKey) return false;

  const payload = JSON.stringify({
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.42,
      similarity_boost: 0.82,
      style: 0.35,
      use_speaker_boost: true,
    },
  });

  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          resolve(false);
          return;
        }

        const file = fs.createWriteStream(outputPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }
    );

    request.on('error', () => resolve(false));
    request.write(payload);
    request.end();
  });
}

function generateMacVoiceSegment(text, outputPath) {
  const tempAiff = outputPath.replace(/\.mp3$/, '.aiff');
  const voiceCandidates = ['Samantha', 'Alex', 'Karen', 'Daniel'];
  let selectedVoice = 'Samantha';

  try {
    const available = execSync('say -v ?', { encoding: 'utf8' });
    for (const voice of voiceCandidates) {
      if (available.includes(voice)) {
        selectedVoice = voice;
        break;
      }
    }
  } catch {
    selectedVoice = 'Samantha';
  }

  run(`say -v ${shellQuote(selectedVoice)} -r 182 -o ${shellQuote(tempAiff)} ${shellQuote(text)}`);
  run(`ffmpeg -y -i ${shellQuote(tempAiff)} -acodec libmp3lame -ab 192k ${shellQuote(outputPath)}`);
  if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff);
}

function createSilentAudio(duration, outputPath) {
  run(
    `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration.toFixed(2)} -c:a libmp3lame -b:a 128k ${shellQuote(outputPath)}`
  );
}

function makeSceneHtml(scene) {
  const theme = {
    blue: ['#081124', '#102a56', '#3b82f6'],
    rose: ['#170910', '#3a1520', '#f43f5e'],
    emerald: ['#061815', '#113d35', '#10b981'],
    violet: ['#10081f', '#2d1662', '#8b5cf6'],
  }[scene.theme || 'blue'];

  const bullets = (scene.bullets || [])
    .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1920px;
      height: 1080px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background:
        radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 30%),
        linear-gradient(135deg, ${theme[0]} 0%, ${theme[1]} 100%);
      overflow: hidden;
    }
    .frame {
      width: 100%;
      height: 100%;
      padding: 92px 108px;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 48px;
      align-items: stretch;
    }
    .left {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .eyebrow {
      color: ${theme[2]};
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 26px;
    }
    h1 {
      margin: 0 0 22px 0;
      font-size: 80px;
      line-height: 0.98;
      letter-spacing: -0.04em;
      max-width: 900px;
    }
    .subtitle {
      max-width: 900px;
      font-size: 32px;
      line-height: 1.35;
      color: rgba(248,250,252,0.86);
    }
    .card {
      border-radius: 36px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 20px 80px rgba(0,0,0,0.25);
      padding: 42px 38px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .card-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${theme[2]};
      margin-bottom: 18px;
    }
    ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    li {
      font-size: 28px;
      line-height: 1.35;
      color: rgba(248,250,252,0.94);
      padding-left: 28px;
      position: relative;
    }
    li::before {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: ${theme[2]};
      position: absolute;
      left: 0;
      top: 14px;
      box-shadow: 0 0 20px ${theme[2]};
    }
  </style>
</head>
<body>
  <div class="frame">
    <section class="left">
      <div class="eyebrow">Syntrophic</div>
      <h1>${escapeHtml(scene.title)}</h1>
      <div class="subtitle">${escapeHtml(scene.subtitle)}</div>
    </section>
    <aside class="card">
      <div class="card-title">Key Point</div>
      <ul>${bullets}</ul>
    </aside>
  </div>
</body>
</html>`;
}

function makeTerminalHtml(scene) {
  const lines = scene.lines
    .map((line) => `<div class="line">${escapeHtml(line)}</div>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1920px;
      height: 1080px;
      background: linear-gradient(135deg, #08111f 0%, #15263e 100%);
      color: #dbeafe;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 80px;
    }
    .terminal {
      width: 1600px;
      border-radius: 28px;
      background: rgba(5, 12, 26, 0.94);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      overflow: hidden;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 28px;
      background: rgba(255,255,255,0.04);
    }
    .dot { width: 14px; height: 14px; border-radius: 999px; }
    .dot.red { background: #fb7185; }
    .dot.yellow { background: #fbbf24; }
    .dot.green { background: #34d399; }
    .title {
      margin-left: 18px;
      font-size: 24px;
      color: #93c5fd;
    }
    .content {
      padding: 34px 36px 42px;
      font-size: 28px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .line { margin-bottom: 8px; }
    .accent { color: #34d399; }
  </style>
</head>
<body>
  <div class="terminal">
    <div class="bar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <div class="title">${escapeHtml(scene.title)}</div>
    </div>
    <div class="content">${lines}</div>
  </div>
</body>
</html>`;
}

async function captureHtmlToPng(browser, html, outputPath) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outputPath, fullPage: false });
  await page.close();
}

async function captureSceneVisuals(browser) {
  const captured = {};
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  for (const scene of scenes) {
    const outputPath = path.join(tempDir, `${scene.id}.png`);

    if (scene.kind === 'slide') {
      await captureHtmlToPng(browser, makeSceneHtml(scene), outputPath);
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'homepage') {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1200);
      try {
        await page.getByRole('button', { name: 'Onboard Agent' }).first().click({ timeout: 5000 });
        await page.waitForTimeout(800);
      } catch {
        // fall back to the hero only
      }
      await page.screenshot({ path: outputPath, fullPage: false });
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'skill') {
      await page.goto(`${BASE_URL}/skill.md`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: outputPath, fullPage: false });
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'onboard') {
      await page.goto(`${BASE_URL}/onboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1200);

      await page.locator('input[placeholder="0x..."]').fill(demoProfile.beneficiary);
      await page.locator('input[placeholder="Scout"]').fill(demoProfile.name);
      await page
        .locator('textarea[placeholder*="Monitors DeFi prices"]')
        .fill(demoProfile.description);
      await page
        .locator('input[placeholder="https://agent.example.com/mcp"]')
        .fill(demoProfile.serviceUrl);
      await page
        .locator('input[placeholder="https://example.com/logo.png"]')
        .fill(demoProfile.imageUrl);

      await page.getByRole('button', { name: 'Create quote' }).click();
      await page.waitForTimeout(2200);

      try {
        await page.locator('text=Quote ID:').first().waitFor({ timeout: 10000 });
      } catch {
        // keep current state even if quote rendering is delayed
      }

      await page.screenshot({ path: outputPath, fullPage: false });
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'explorer') {
      await page.goto(`${BASE_URL}/explore?filter=syntrophic`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: outputPath, fullPage: false });
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'verification') {
      await page.goto(proofDemo.verificationUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: outputPath, fullPage: false });
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'proof') {
      const proofScene = {
        title: 'On-Chain Proof Summary',
        lines: [
          `Prompt: ${PROMPT_TEXT}`,
          `Agent ID: ${proofDemo.agentId}`,
          `Tx Hash: ${proofDemo.txHash}`,
          'Reputation staking: BONDED',
          `Verification URL: ${proofDemo.verificationUrl}`,
          `Learn more: ${BASE_URL}/erc-draft`,
        ],
      };
      await captureHtmlToPng(browser, makeTerminalHtml(proofScene), outputPath);
      captured[scene.id] = outputPath;
      continue;
    }

    if (scene.id === 'draft') {
      await page.goto(`${BASE_URL}/erc-draft`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: outputPath, fullPage: false });
      captured[scene.id] = outputPath;
      continue;
    }
  }

  await page.close();
  return captured;
}

function concatAudio(inputs, outputFile) {
  const ffmpegInputs = inputs.map((file) => `-i ${shellQuote(file)}`).join(' ');
  const filterInputs = inputs.map((_, index) => `[${index}:a]`).join('');
  run(
    `ffmpeg -y ${ffmpegInputs} -filter_complex "${filterInputs}concat=n=${inputs.length}:v=0:a=1[out]" -map "[out]" -c:a libmp3lame -b:a 192k ${shellQuote(outputFile)}`
  );
}

function buildSceneVideo(imageFile, duration, outputFile) {
  run(
    `ffmpeg -y -loop 1 -i ${shellQuote(imageFile)} -t ${duration.toFixed(2)} -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p" -r 30 -c:v libx264 -preset fast -crf 20 ${shellQuote(outputFile)}`
  );
}

function concatVideo(inputs, outputFile) {
  const listFile = path.join(tempDir, 'scene-concat.txt');
  fs.writeFileSync(listFile, inputs.map((file) => `file '${file.replace(/'/g, `'\\''`)}'`).join('\n'));
  try {
    run(`ffmpeg -y -f concat -safe 0 -i ${shellQuote(listFile)} -c copy ${shellQuote(outputFile)}`);
  } catch {
    run(`ffmpeg -y -f concat -safe 0 -i ${shellQuote(listFile)} -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k ${shellQuote(outputFile)}`);
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const inputContext = readInputContext();

  ensureDir(tempDir);
  ensureDir(outputDir);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      Syntrophic 4-Minute Site Presentation Generator      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Voice: ${DEFAULT_VOICE_NAME} (${DEFAULT_VOICE_ID})`);
  console.log(`Output: ${OUTPUT_VIDEO}`);
  console.log(`Input docs loaded: ${inputContext ? 'yes' : 'no'}`);

  if (dryRun) {
    console.log('\nDry run scene order:');
    scenes.forEach((scene, index) => {
      console.log(`${index + 1}. ${scene.id} (${scene.kind})`);
    });
    return;
  }

  const apiKey = getElevenLabsApiKey();
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('\n▶ Capturing visuals...');
    const visualFiles = await captureSceneVisuals(browser);
    console.log('  ✓ Visuals captured');

    console.log('\n▶ Generating voice segments...');
    const sceneAudioFiles = [];
    const sceneVideoFiles = [];
    const paddedAudioFiles = [];

    for (const scene of scenes) {
      const audioFile = path.join(tempDir, `${scene.id}.mp3`);
      const paddedAudioFile = path.join(tempDir, `${scene.id}-padded.mp3`);
      const videoFile = path.join(tempDir, `${scene.id}.mp4`);

      let generated = false;
      if (apiKey) {
        generated = await generateVoiceSegment(scene.narration, audioFile, apiKey);
      }

      if (!generated) {
        try {
          generateMacVoiceSegment(scene.narration, audioFile);
          generated = true;
        } catch {
          createSilentAudio(scene.minDuration, audioFile);
        }
      }

      const measured = getAudioDuration(audioFile);
      const sceneDuration = Math.max(scene.minDuration, measured + 1.2);

      run(
        `ffmpeg -y -i ${shellQuote(audioFile)} -af "apad=pad_dur=${Math.max(0, sceneDuration - measured).toFixed(2)}" -t ${sceneDuration.toFixed(2)} -c:a libmp3lame -b:a 192k ${shellQuote(paddedAudioFile)}`
      );
      buildSceneVideo(visualFiles[scene.id], sceneDuration, videoFile);

      sceneAudioFiles.push(audioFile);
      paddedAudioFiles.push(paddedAudioFile);
      sceneVideoFiles.push(videoFile);

      console.log(`  ✓ ${scene.id}: ${sceneDuration.toFixed(2)}s`);
    }

    console.log('\n▶ Concatenating scenes...');
    const baseVideo = path.join(tempDir, 'base.mp4');
    const voiceTrack = path.join(tempDir, 'voice-track.mp3');
    concatVideo(sceneVideoFiles, baseVideo);
    concatAudio(paddedAudioFiles, voiceTrack);

    const totalDuration = getAudioDuration(voiceTrack);
    console.log(`  ✓ Total duration: ${totalDuration.toFixed(2)}s`);

    console.log('\n▶ Mixing final audio...');
    if (fs.existsSync(MUSIC_FILE)) {
      run(
        `ffmpeg -y -i ${shellQuote(baseVideo)} -i ${shellQuote(voiceTrack)} -i ${shellQuote(MUSIC_FILE)} ` +
          `-filter_complex "[1:a]volume=1.0[voice];[2:a]aloop=loop=-1:size=2e+09,atrim=0:${totalDuration.toFixed(2)},volume=0.10,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0, totalDuration - 2.5).toFixed(2)}:d=2.5[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
          `-map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 256k -shortest ${shellQuote(OUTPUT_VIDEO)}`
      );
    } else {
      run(
        `ffmpeg -y -i ${shellQuote(baseVideo)} -i ${shellQuote(voiceTrack)} -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest ${shellQuote(OUTPUT_VIDEO)}`
      );
    }

    const finalDuration = getAudioDuration(OUTPUT_VIDEO);
    console.log('\n✅ 4-minute site presentation ready');
    console.log(`   File: ${OUTPUT_VIDEO}`);
    console.log(`   Duration: ${finalDuration.toFixed(2)}s`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('\n❌ Video generation failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
