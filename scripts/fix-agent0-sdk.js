#!/usr/bin/env node

/**
 * Fix agent0-sdk ES module imports
 *
 * This script adds .js extensions to all imports in the agent0-sdk package
 * to make them compatible with Node.js ES modules.
 *
 * Why is this needed?
 * - SDK v0.2.2 includes a postinstall script that runs codegen
 * - However, graphql-codegen is in devDependencies, not dependencies
 * - When SDK is installed as a dependency, devDependencies are not installed
 * - This causes the postinstall to fail, leaving imports without .js extensions
 * - Our fix ensures ES module compatibility regardless of SDK postinstall success
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
        const originalContent = content;

        // Fix: export * from './path' -> export * from './path/index.js' or './path.js'
        content = content.replace(
            /from ['"](\.[^'"]+)['"]/g,
            (match, importPath) => {
                // Skip if already has .js extension
                if (importPath.endsWith('.js')) {
                    return match;
                }

                // Resolve the full path relative to the current file
                const currentDir = dirname(filePath);
                const absolutePath = join(currentDir, importPath);

                // Check if it's a directory or file
                try {
                    const stat = statSync(absolutePath);
                    if (stat.isDirectory()) {
                        // It's a directory, add /index.js
                        return `from '${importPath}/index.js'`;
                    }
                } catch (e) {
                    // Path doesn't exist as-is, try with .js
                }

                // Check if .js file exists
                try {
                    statSync(absolutePath + '.js');
                    return `from '${importPath}.js'`;
                } catch (e) {
                    // Fallback: try /index.js
                    try {
                        statSync(join(absolutePath, 'index.js'));
                        return `from '${importPath}/index.js'`;
                    } catch (e2) {
                        // Default to .js if we can't determine
                        return `from '${importPath}.js'`;
                    }
                }
            }
        );

        // Fix: import('./path') -> import('./path.js') or import('./path/index.js')
        content = content.replace(
            /import\(['"](\.[^'"]+)['"]\)/g,
            (match, importPath) => {
                if (importPath.endsWith('.js')) {
                    return match;
                }

                const currentDir = dirname(filePath);
                const absolutePath = join(currentDir, importPath);

                try {
                    const stat = statSync(absolutePath);
                    if (stat.isDirectory()) {
                        return `import('${importPath}/index.js')`;
                    }
                } catch (e) {}

                try {
                    statSync(absolutePath + '.js');
                    return `import('${importPath}.js')`;
                } catch (e) {
                    try {
                        statSync(join(absolutePath, 'index.js'));
                        return `import('${importPath}/index.js')`;
                    } catch (e2) {
                        return `import('${importPath}.js')`;
                    }
                }
            }
        );

        if (content !== originalContent) {
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
