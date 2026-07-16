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
      
      // AppShell
      content = content.replace(/bg- border-r border-border/g, 'bg-card border-r border-border');
      content = content.replace(/text-\[15px\] text- leading-tight/g, 'text-[15px] text-ink leading-tight');
      content = content.replace(/bg- flex items-center justify-center text- text-xs/g, 'bg-soft-mint flex items-center justify-center text-signal-teal text-xs');
      content = content.replace(/text-\[13px\] font-semibold text- truncate/g, 'text-[13px] font-semibold text-ink truncate');
      content = content.replace(/text-\[11px\] text- truncate/g, 'text-[11px] text-secondary truncate');
      content = content.replace(/\"text- hover:bg-\[\#F5F5F3\] hover:text-\"/g, '\"text-secondary hover:bg-paper hover:text-ink\"');
      content = content.replace(/\"text-\" : \"text-\"/g, '\"text-signal-teal\" : \"text-secondary\"');
      content = content.replace(/border-t border- pt-3/g, 'border-t border-border pt-3');
      content = content.replace(/text- hover:bg-red-50/g, 'text-error hover:bg-red-50');
      content = content.replace(/bg- border-b border-border/g, 'bg-card border-b border-border');

      // BotManager
      content = content.replace(/\"border- bg-card\"/g, '\"border-signal-teal bg-card\"');
      content = content.replace(/\"border- bg-card hover:bg-paper\[\#F5F5F3\]\"/g, '\"border-transparent bg-card hover:bg-paper\"');
      content = content.replace(/text- mt-1/g, 'text-secondary mt-1');
      content = content.replace(/text-\"\>Click to upload/g, 'text-signal-teal\"\>Click to upload');
      content = content.replace(/text-\[10px\] text- mt-0\.5/g, 'text-[10px] text-secondary mt-0.5');
      content = content.replace(/bg- flex gap-1\.5 items-center/g, 'bg-paper flex gap-1.5 items-center');
      content = content.replace(/bg- border-t border- flex gap-2/g, 'bg-card border-t border-border flex gap-2');
      content = content.replace(/w-4 h-4 text- transition/g, 'w-4 h-4 text-secondary transition');
      content = content.replace(/w-4 h-4 text-\"/g, 'w-4 h-4 text-ink\"');
      content = content.replace(/bg-red-50 text-\'/g, 'bg-red-50 text-error\'');
      content = content.replace(/bg-amber-50 text-\'/g, 'bg-amber-50 text-amber\'');
      content = content.replace(/text-xs text- mt-2 bg-red-50/g, 'text-xs text-error mt-2 bg-red-50');
      content = content.replace(/\'border- bg-\'/g, '\'border-signal-teal bg-soft-mint\'');
      content = content.replace(/\'border- bg- hover:border-signal-teal hover:bg-\/30\'/g, '\'border-border bg-card hover:border-signal-teal hover:bg-soft-mint/30\'');
      content = content.replace(/w-6 h-6 text-\"/g, 'w-6 h-6 text-signal-teal\"');
      content = content.replace(/text- font-semibold text-sm/g, 'text-ink font-semibold text-sm');
      content = content.replace(/bg- p-4 border border-\/20/g, 'bg-paper p-4 border border-border/20');
      
      // ChatHistoryList & Dashboard
      content = content.replace(/w-12 h-12 rounded-full bg- flex items-center/g, 'w-12 h-12 rounded-full bg-soft-mint flex items-center');
      content = content.replace(/text- font-semibold mb-1/g, 'text-ink font-semibold mb-1');
      content = content.replace(/hover:bg- transition/g, 'hover:bg-paper transition');
      content = content.replace(/text-xs text-\"/g, 'text-xs text-secondary\"');
      content = content.replace(/bg- border-t border- max-h-\[500px\]/g, 'bg-paper border-t border-border max-h-[500px]');
      content = content.replace(/text-\[10px\] text- mt-1/g, 'text-[10px] text-secondary mt-1');
      content = content.replace(/text-sm font-semibold text- border border-border/g, 'text-sm font-semibold text-signal-teal border border-border');
      content = content.replace(/text-sm font-medium text- px-3/g, 'text-sm font-medium text-error px-3');
      content = content.replace(/border-2 border-dashed border- rounded-xl/g, 'border-2 border-dashed border-border rounded-xl');

      // NotificationBell
      content = content.replace(/text- hover:bg- hover:text- transition-colors/g, 'text-secondary hover:bg-paper hover:text-ink transition-colors');
      
      // Leftovers
      content = content.replace(/bg- flex items-center justify-center/g, 'bg-paper flex items-center justify-center');
      content = content.replace(/text- text-sm/g, 'text-secondary text-sm');
      content = content.replace(/w-5 h-5 text-\"/g, 'w-5 h-5 text-signal-teal\"');
      content = content.replace(/w-10 h-10 rounded-lg bg- flex/g, 'w-10 h-10 rounded-lg bg-soft-mint flex');
      content = content.replace(/hover:border- rounded-xl/g, 'hover:border-signal-teal rounded-xl');
      content = content.replace(/bg- hover:bg-teal-dark/g, 'bg-signal-teal hover:bg-teal-dark');
      content = content.replace(/hover:bg- transition-colors text-sm text-center/g, 'hover:bg-paper transition-colors text-sm text-center');
      content = content.replace(/text-xs text-\"/g, 'text-xs text-secondary\"');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
processDir('./src');
console.log('Final fixes applied!');
