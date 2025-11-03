#!/usr/bin/env node

/**
 * Fix agent0-sdk ES module imports
 * This script adds .js extensions to all imports in the agent0-sdk package
 * to make them compatible with Node.js ES modules
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SDK_PATH = join(__dirname, '..', 'node_modules', 'agent0-sdk', 'dist');

console.log('🔧 Fixing agent0-sdk ES module imports...\n');

function fixImportsInFile(filePath) {
    try {
        let content = readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix: export * from './path' -> export * from './path.js' (if path is a file)
        // Fix: export * from './path' -> export * from './path/index.js' (if path is a dir)
        content = content.replace(
            /from ['"](\.[^'"]+)['"]/g,
            (match, importPath) => {
                // Skip if already has .js extension
                if (importPath.endsWith('.js')) {
                    return match;
                }

                // Add .js extension
                modified = true;
                return `from '${importPath}.js'`;
            }
        );

        // Fix: import('./path') -> import('./path.js')
        content = content.replace(
            /import\(['"](\.[^'"]+)['"]\)/g,
            (match, importPath) => {
                if (importPath.endsWith('.js')) {
                    return match;
                }
                modified = true;
                return `import('${importPath}.js')`;
            }
        );

        if (modified) {
            writeFileSync(filePath, content, 'utf8');
            return true;
        }
        return false;
    } catch (error) {
        console.error(`  ❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

function processDirectory(dirPath) {
    let filesFixed = 0;

    try {
        const entries = readdirSync(dirPath);

        for (const entry of entries) {
            const fullPath = join(dirPath, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                filesFixed += processDirectory(fullPath);
            } else if (entry.endsWith('.js') && !entry.endsWith('.map')) {
                if (fixImportsInFile(fullPath)) {
                    const relativePath = fullPath.replace(SDK_PATH, '');
                    console.log(`  ✓ Fixed: ${relativePath}`);
                    filesFixed++;
                }
            }
        }
    } catch (error) {
        console.error(`  ❌ Error processing directory ${dirPath}:`, error.message);
    }

    return filesFixed;
}

try {
    const filesFixed = processDirectory(SDK_PATH);

    if (filesFixed > 0) {
        console.log(`\n✅ Fixed ${filesFixed} file(s) in agent0-sdk\n`);
    } else {
        console.log('\n✅ No files needed fixing (already patched)\n');
    }
} catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
}
