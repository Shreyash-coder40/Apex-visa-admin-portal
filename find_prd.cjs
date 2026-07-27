const fs = require('fs');
const path = require('path');

const logDir = 'C:\\Users\\HP PC\\.gemini\\antigravity\\brain\\541429c5-8849-4553-9d94-d60749fba0b2\\.system_generated\\logs';
const files = ['transcript.jsonl', 'transcript_full.jsonl'];

for (const file of files) {
  const p = path.join(logDir, file);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes('prd')) {
        console.log(`[${file}:${i+1}] ${line.substring(0, 300)}...`);
      }
    });
  }
}
