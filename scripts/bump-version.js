#!/usr/bin/env node
/**
 * scripts/bump-version.js
 * 
 * Script de Versionamento Automático Semântico (SemVer)
 * Projetado para vibe coding e agentes autônomos de IA.
 * 
 * Uso:
 *   node scripts/bump-version.js [patch|minor|major|auto]
 * 
 * Modo 'auto':
 *   - Se encontrar 'BREAKING CHANGE' ou 'feat!:' nos commits recentes -> MAJOR (ex: 2.0.0 -> 3.0.0)
 *   - Se encontrar 'feat:' ou 'feature:' nos commits recentes -> MINOR (ex: 2.0.0 -> 2.1.0)
 *   - Caso contrário (fix, refactor, style, chore) -> PATCH (ex: 2.0.0 -> 2.0.1)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = resolve(__dirname, '../frontend/package.json');
const pkgData = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const currentVersion = pkgData.version || '2.0.0';

let [major, minor, patch] = currentVersion.split('.').map(Number);
if (isNaN(major)) major = 2;
if (isNaN(minor)) minor = 0;
if (isNaN(patch)) patch = 0;

const bumpTypeArg = process.argv[2] || 'auto';
let bumpType = bumpTypeArg;

if (bumpType === 'auto') {
  try {
    const recentCommits = execSync('git log -n 5 --oneline', { encoding: 'utf-8' }).toLowerCase();
    
    if (recentCommits.includes('breaking change') || recentCommits.includes('feat!:') || recentCommits.includes('major:')) {
      bumpType = 'major';
    } else if (recentCommits.includes('feat:') || recentCommits.includes('feature:') || recentCommits.includes('minor:')) {
      bumpType = 'minor';
    } else {
      bumpType = 'patch';
    }
  } catch (err) {
    bumpType = 'patch';
  }
}

let newVersion;
if (bumpType === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bumpType === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

pkgData.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n', 'utf-8');

console.log(`🚀 GamificaEdu version bumped: v${currentVersion} -> v${newVersion} (${bumpType})`);
