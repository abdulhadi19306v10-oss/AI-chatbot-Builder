const fs = require('fs');
const path = require('path');

const replacements = {
  '#1FA391': 'signal-teal',
  '#1fa391': 'signal-teal',
  '#167A6D': 'teal-dark',
  '#167a6d': 'teal-dark',
  '#FAFAF8': 'paper',
  '#fafaf8': 'paper',
  '#ffffff': 'card',
  '#FFFFFF': 'card',
  '#E4F5F0': 'soft-mint',
  '#e4f5f0': 'soft-mint',
  '#14171F': 'ink',
  '#14171f': 'ink',
  '#6d7a76': 'secondary',
  '#6D7A76': 'secondary',
  '#E5E4DE': 'border',
  '#e5e4de': 'border',
  '#2E9E5B': 'success',
  '#2e9e5b': 'success',
  '#D64545': 'error',
  '#d64545': 'error',
  '#E8A33D': 'amber',
  '#e8a33d': 'amber'
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      for (const [hex, name] of Object.entries(replacements)) {
        const regex = new RegExp('\\\\[' + hex + '\\\\]', 'g');
        content = content.replace(regex, '-' + name);
      }
      
      // Second, replace inline styles using hex codes directly
      for (const [hex, name] of Object.entries(replacements)) {
        const regex = new RegExp(hex, 'g');
        content = content.replace(regex, 'var(--color-' + name + ')');
      }

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('./src');
console.log('Replaced all hardcoded colors with Tailwind tokens!');
