const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/bg-(?= flex items-center justify-center shadow-md)/g, 'bg-signal-teal');
      content = content.replace(/bg-(?= flex items-center justify-center mb-4)/g, 'bg-soft-mint');
      content = content.replace(/border- border-t-/g, 'border-border border-t-signal-teal');
      content = content.replace(/text- text-\[15px\]/g, 'text-secondary text-[15px]');
      content = content.replace(/text- text-sm/g, 'text-error text-sm'); 
      content = content.replace(/text- mb-1/g, 'text-secondary mb-1');
      content = content.replace(/text- text-sm\"/g, 'text-secondary text-sm\"');
      content = content.replace(/text- font-medium/g, 'text-secondary font-medium');
      content = content.replace(/text- hover:text-/g, 'text-signal-teal hover:text-teal-dark');
      content = content.replace(/text- placeholder:text-/g, 'text-ink placeholder:text-secondary');
      content = content.replace(/text- hover:text- transition\"/g, 'text-secondary hover:text-ink transition\"');
      content = content.replace(/text- mb-2/g, 'text-secondary mb-2');
      content = content.replace(/text-\"(?=>\{bots\.length\})/g, 'text-ink\"');
      content = content.replace(/text-\"(?=>\{activeBots\.length\})/g, 'text-signal-teal\"');
      content = content.replace(/border-t border-\"/g, 'border-t border-border\"');
      content = content.replace(/border border-\"/g, 'border border-border\"');
      content = content.replace(/hover:border- /g, 'hover:border-signal-teal ');
      content = content.replace(/bg- hover:bg-/g, 'bg-card hover:bg-paper');
      content = content.replace(/bg-\"/g, 'bg-card\"');
      content = content.replace(/bg- flex items-center justify-center\"/g, 'bg-paper flex items-center justify-center\"');
      content = content.replace(/bg- text-/g, 'bg-card text-ink');
      content = content.replace(/text-\"(?=>\{bot\.name\})/g, 'text-ink\"');
      content = content.replace(/text- fill=\"none\"/g, 'text-signal-teal fill=\"none\"');
      content = content.replace(/px-3 bg-card text-secondary font-medium/g, 'px-3 bg-paper text-secondary font-medium');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
processDir('./src');
console.log('Fixed more tailwind classes!');
