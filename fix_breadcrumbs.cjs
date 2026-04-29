const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('Modules/Microfinance/resources/js/pages', (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find where breadcrumbs is defined inside a component.
  // We'll look for `export default function` then later `const breadcrumbs`
  
  if (content.includes('const breadcrumbs')) {
      const functionMatch = content.match(/export default function[^{]+\{([\s\S]*?)const breadcrumbs(?::[^=]+)?\s*=\s*\[([\s\S]*?)\];/);
      
      if (functionMatch) {
          // It's defined inside the function!
          // We need to extract it and move it above the function.
          
          // Let's use a regex that matches `const breadcrumbs... = [...];`
          const bcRegex = /[ \t]*const breadcrumbs(?::[^=]+)?\s*=\s*\[[\s\S]*?\];\r?\n?/;
          const bcMatch = content.match(bcRegex);
          
          if (bcMatch && functionMatch.index < bcMatch.index) {
              // It's indeed after export default function
              const bcString = bcMatch[0].trim();
              
              // remove it from where it is
              content = content.replace(bcRegex, '');
              
              // put it right before `export default function`
              content = content.replace(/export default function/, `${bcString}\n\nexport default function`);
              
              fs.writeFileSync(filePath, content);
              console.log('Fixed breadcrumbs scoping:', filePath);
          }
      }
  }
});
