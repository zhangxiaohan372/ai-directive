/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

// Anti-Pattern 1: Strict Zero-Emoji Rule (from /skills/custom_skills/mystery-platform-ui-style/SKILL.md)
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('dist') && !fullPath.includes('.playwright-cli')) {
        walkDir(fullPath, fileList);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = walkDir('src');
let errors = 0;

for (const file of files) {
  // Skip test files or comments if needed, but in our UI code everything should be clean
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (emojiRegex.test(line)) {
      console.error(
        `[UI Style Guardrail Error] ${file}:${i + 1} 发现未合规 Emoji 字符！` +
        `\n  -> 违反 /skills/custom_skills/mystery-platform-ui-style/SKILL.md 反例 1 (Strict Zero-Emoji Rule)` +
        `\n  -> 涉及行代码: ${line.trim()}`
      );
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n❌ [Guardrail Check Failed] 共发现 ${errors} 处违反 UI Style Skill 规范的代码。请查阅 SKILL.md 进行修正。`);
  process.exit(1);
} else {
  console.log('✅ [UI Style Guardrail Pass] 100% 符合 /skills/custom_skills/mystery-platform-ui-style/SKILL.md 规范！');
}
