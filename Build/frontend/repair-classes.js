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
      
      // Auto-repair obvious patterns
      content = content.replace(/border border-(?=[ "\'])/g, 'border border-border');
      content = content.replace(/bg-(?= border border-border)/g, 'bg-card');
      content = content.replace(/bg-(?= border border-)/g, 'bg-card');
      
      content = content.replace(/border-b border-(?=[ "\'])/g, 'border-b border-border');
      content = content.replace(/border-r border-(?=[ "\'])/g, 'border-r border-border');
      
      // Text colors
      content = content.replace(/text-3xl font-bold text-(?=[ "\'])/g, 'text-3xl font-bold text-ink');
      content = content.replace(/text-lg font-semibold text-(?=[ "\'])/g, 'text-lg font-semibold text-ink');
      content = content.replace(/font-bold text-(?=[ "\'])/g, 'font-bold text-ink');
      
      content = content.replace(/text-xs font-semibold uppercase tracking-wider text-(?=[ "\'])/g, 'text-xs font-semibold uppercase tracking-wider text-secondary');
      content = content.replace(/text-sm text-(?=[ "\'])/g, 'text-sm text-secondary');
      content = content.replace(/text-(?= mt-1 text-\[15px\])/g, 'text-secondary'); // dashboard subtitle
      content = content.replace(/text-(?= mb-8 text-\[15px\])/g, 'text-secondary'); // welcome subtitle
      content = content.replace(/text-(?= mt-2 text-\[15px\])/g, 'text-secondary'); 

      // Buttons
      content = content.replace(/bg-(?= hover:bg-teal-dark)/g, 'bg-signal-teal');
      content = content.replace(/hover:bg-(?= text-white)/g, 'hover:bg-teal-dark');
      content = content.replace(/bg-(?= text-white)/g, 'bg-signal-teal');
      
      // Inputs
      content = content.replace(/focus:ring-(?=[ "\'])/g, 'focus:ring-signal-teal');
      content = content.replace(/focus:border-(?=[ "\'])/g, 'focus:border-signal-teal');

      // Gradients
      content = content.replace(/from-(?=[ "\'])/g, 'from-signal-teal');
      content = content.replace(/to-(?=[ "\'])/g, 'to-teal-dark');

      // specific fixes
      content = content.replace(/bg-(?= flex items-center justify-center shrink-0)/g, 'bg-soft-mint');
      content = content.replace(/text-2xl font-bold text-(?=[ "\'])/g, 'text-2xl font-bold text-ink');
      content = content.replace(/bg- p-6 rounded-2xl/g, 'bg-card p-6 rounded-2xl');
      content = content.replace(/bg-(?= rounded-2xl shadow-sm p-10)/g, 'bg-card');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
processDir('./src');
console.log('Auto-repaired most Tailwind classes!');
