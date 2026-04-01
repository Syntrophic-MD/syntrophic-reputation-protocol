#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const scriptsDir = __dirname;
const generator = path.join(scriptsDir, 'generate-3min-presentation.js');
const args = process.argv.slice(2);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║      Syntrophic Quick Site Demo Workflow                  ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Using the quick site-only pipeline:');
console.log('- opening slides');
console.log('- homepage prompt');
console.log('- public skill page');
console.log('- x402 demo page');
console.log('- verification page');
console.log('- on-chain proof card');
console.log('');

const result = spawnSync('node', [generator, ...args], {
  cwd: scriptsDir,
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
