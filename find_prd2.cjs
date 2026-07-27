const fs = require('fs');
const path = require('path');

const logDir = 'C:\\Users\\HP PC\\.gemini\\antigravity\\brain\\541429c5-8849-4553-9d94-d60749fba0b2\\.system_generated\\logs';
const p = path.join(logDir, 'transcript_full.jsonl');

if (fs.existsSync(p)) {
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  let startPrint = false;
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"step_index":3536')) {
      startPrint = true;
    }
    if (startPrint && lines[i].includes('"type":"USER_INPUT"')) {
      console.log(`[USER_INPUT AFTER 3536]`);
      console.log(JSON.parse(lines[i]).content);
      count++;
      if (count >= 2) break;
    }
  }
}
