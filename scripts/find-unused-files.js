#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "src");
const projectRoot = path.join(__dirname, "..");

// File che sono sempre considerati usati (entry points, ecc.)
const alwaysUsed = new Set([
  "main.jsx",
  "App.jsx",
  "setup.js", // test setup
]);

// Trova tutti i file .js, .jsx, .ts, .tsx
function getAllSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllSourceFiles(fullPath, files);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Estrai gli import da un file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const imports = [];

    // Match import statements
    const importRegex =
      /import\s+(?:{[^}]*}|[\w*]+(?:\s*,\s*{[^}]*})?|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return [];
  }
}

// Risolvi il path relativo in path assoluto
function resolveImportPath(importPath, fromFile) {
  if (!importPath.startsWith(".")) {
    return null; // È un modulo npm, non un file locale
  }

  const fromDir = path.dirname(fromFile);
  let resolved = path.resolve(fromDir, importPath);

  // Prova ad aggiungere estensioni
  const extensions = ["", ".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.jsx"];
  for (const ext of extensions) {
    const testPath = resolved + ext;
    if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
      return testPath;
    }
  }

  return null;
}

// Main
const allFiles = getAllSourceFiles(srcDir);
const usedFiles = new Set();

// Aggiungi file sempre usati
for (const file of allFiles) {
  const basename = path.basename(file);
  if (alwaysUsed.has(basename)) {
    usedFiles.add(file);
  }
}

// Entry points aggiuntivi (package.json, vite.config, ecc.)
const indexHtml = path.join(projectRoot, "index.html");
if (fs.existsSync(indexHtml)) {
  const content = fs.readFileSync(indexHtml, "utf-8");
  const scriptMatch = content.match(/src=["']([^"']+\.jsx?)["']/);
  if (scriptMatch) {
    const entryPoint = path.join(projectRoot, scriptMatch[1]);
    if (fs.existsSync(entryPoint)) {
      usedFiles.add(entryPoint);
    }
  }
}

// Analizza tutti i file per trovare le dipendenze
console.log("Analizzando dipendenze...\n");
const fileQueue = [...usedFiles];
const processed = new Set();

while (fileQueue.length > 0) {
  const currentFile = fileQueue.shift();
  if (processed.has(currentFile)) continue;
  processed.add(currentFile);

  const imports = extractImports(currentFile);
  for (const imp of imports) {
    const resolved = resolveImportPath(imp, currentFile);
    if (resolved && !usedFiles.has(resolved)) {
      usedFiles.add(resolved);
      fileQueue.push(resolved);
    }
  }
}

// Trova file non usati
const unusedFiles = allFiles.filter((f) => !usedFiles.has(f));

console.log("=== FILE NON UTILIZZATI ===\n");
if (unusedFiles.length === 0) {
  console.log("✅ Tutti i file sono utilizzati!\n");
} else {
  unusedFiles.sort();
  for (const file of unusedFiles) {
    const relativePath = path.relative(projectRoot, file);
    const size = fs.statSync(file).size;
    console.log(`- ${relativePath} (${size} bytes)`);
  }
  console.log(`\nTotale: ${unusedFiles.length} file non utilizzati`);
}

console.log(`\n=== STATISTICHE ===`);
console.log(`File totali: ${allFiles.length}`);
console.log(`File utilizzati: ${usedFiles.size}`);
console.log(`File non utilizzati: ${unusedFiles.length}`);
