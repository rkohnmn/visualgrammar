#!/usr/bin/env node
/**
 * Cross-platform verification runner for VisualGrammar.
 * Auto-detects python3 or python on Windows, Linux, and macOS.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function getPythonCommand() {
  for (const cmd of ['python3', 'python']) {
    try {
      const res = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
      if (res.status === 0) return cmd;
    } catch {
      // try next command
    }
  }
  return 'python';
}

const py = getPythonCommand();

const verifyBuild = spawnSync(py, ['tests/verify-build.py'], { stdio: 'inherit' });
if (verifyBuild.status !== 0) {
  process.exit(verifyBuild.status || 1);
}

const proseTargets = [
  'README.md',
  'ARCHITECTURE.md',
  'METHODS.md',
  'DATA_FORMATS.md',
  'TESTING.md',
  'COVERAGE_MATRIX.md',
  'DEVELOPMENT.md',
  'docs/ARCHITECTURE.md',
  'docs/RESEARCH.md',
  'docs/PRIVACY.md',
  'docs/LAUNCH_PLAN.md'
];

const proseLint = spawnSync(py, ['scripts/prose_linter.py', ...proseTargets], { stdio: 'inherit' });
if (proseLint.status !== 0) {
  process.exit(proseLint.status || 1);
}
