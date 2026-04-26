// extract-project-files.js
const fs = require('fs');
const path = require('path');

// Files and folders to include (relative to project root)
const targets = [
  'src/app/app.module.ts',
  'src/app/app-routing.module.ts',
  'src/app/app.component.ts',
  'src/app/auth/',          // entire auth folder
  'src/app/guards/',        // guards folder if exists
  'src/app/services/',      // services folder
  'src/app/components/',    // components folder
  'src/app/pages/',         // pages folder
  'src/app/views/',         // alternative views folder
  'src/app/shared/',        // shared folder
];

// File patterns to specifically look for (even inside folders)
const includePatterns = [
  'auth.service.ts',
  'auth.guard.ts',
  'admin.guard.ts',
  'role.guard.ts',
  'interceptor.ts',
  'http.interceptor.ts',
  'token.service.ts',
  'user.service.ts',
  'disaster.service.ts',
  '*.component.ts',        // all component files
];

// Directories to ignore
const ignoreDirs = ['node_modules', '.angular', 'dist', '.git'];

// Output file
const outputFile = 'project-extracted.txt';

function shouldIncludeFile(filePath) {
  const fileName = path.basename(filePath);
  // Check if file matches any pattern
  for (const pattern of includePatterns) {
    if (pattern === '*.component.ts') {
      if (fileName.endsWith('.component.ts')) return true;
    } else if (fileName === pattern) {
      return true;
    }
  }
  return false;
}

function getFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (ignoreDirs.some(ignore => fullPath.includes(ignore))) continue;
      if (stat.isDirectory()) {
        if (targets.some(t => fullPath.endsWith(t) || fullPath.includes(t))) {
          getFiles(fullPath, fileList);
        } else {
          // still check inside if it's under src
          if (fullPath.includes('src')) getFiles(fullPath, fileList);
        }
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.scss'))) {
        if (shouldIncludeFile(fullPath)) {
          fileList.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn(`Cannot read ${dir}: ${err.message}`);
  }
  return fileList;
}

function extractFiles() {
  const allFiles = [];
  for (const target of targets) {
    const targetPath = path.join(process.cwd(), target);
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        getFiles(targetPath, allFiles);
      } else {
        allFiles.push(targetPath);
      }
    }
  }
  // Also scan src/app recursively for any .service.ts or .guard.ts files
  const srcApp = path.join(process.cwd(), 'src', 'app');
  if (fs.existsSync(srcApp)) {
    const deepFiles = fs.readdirSync(srcApp, { recursive: true });
    for (const file of deepFiles) {
      const fullPath = path.join(srcApp, file);
      if (fs.statSync(fullPath).isFile() && (file.endsWith('.service.ts') || file.endsWith('.guard.ts') || file.includes('auth') || file.includes('role'))) {
        if (!allFiles.includes(fullPath)) allFiles.push(fullPath);
      }
    }
  }
  // Write to output
  let output = '';
  for (const file of allFiles) {
    output += `\n\n=== FILE: ${file.replace(process.cwd(), '')} ===\n`;
    try {
      const content = fs.readFileSync(file, 'utf8');
      output += content;
    } catch (err) {
      output += `ERROR READING FILE: ${err.message}`;
    }
  }
  fs.writeFileSync(outputFile, output);
  console.log(`✅ Extracted ${allFiles.length} files to ${outputFile}`);
  console.log('Please upload this file so I can analyze your authentication and component structure.');
}

extractFiles();