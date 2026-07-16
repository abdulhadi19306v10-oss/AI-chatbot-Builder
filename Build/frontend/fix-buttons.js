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
      
      content = content.replace(/bg-card hover:bg-paperteal-dark/g, 'bg-signal-teal hover:bg-teal-dark');
      content = content.replace(/bg-card hover:bg-paper text-white/g, 'bg-signal-teal hover:bg-teal-dark text-white');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
processDir('./src');
console.log('Fixed buttons!');
