const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const extensionDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(extensionDir, '..');
const serviceSourceDir = path.join(repoRoot, 'service');
const governanceSourceDir = path.join(repoRoot, 'governance');
const bundledServiceDir = path.join(extensionDir, 'bundled-service');

function copyRecursive(sourcePath, targetPath) {
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
        fs.mkdirSync(targetPath, { recursive: true });

        for (const entry of fs.readdirSync(sourcePath)) {
            copyRecursive(path.join(sourcePath, entry), path.join(targetPath, entry));
        }

        return;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
}

function runCommand(command, args, cwd) {
    const executable = process.platform === 'win32' ? 'cmd.exe' : command;
    const executableArgs = process.platform === 'win32'
        ? ['/d', '/s', '/c', command, ...args]
        : args;

    const result = spawnSync(executable, executableArgs, {
        cwd,
        stdio: 'inherit',
        shell: false
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
    }
}

function main() {
    const serviceDistDir = path.join(serviceSourceDir, 'dist');
    const servicePackageJson = path.join(serviceSourceDir, 'package.json');
    const servicePackageLock = path.join(serviceSourceDir, 'package-lock.json');

    if (!fs.existsSync(serviceDistDir)) {
        throw new Error('Service is not built. Run "npm run build" in the service folder first.');
    }

    if (fs.existsSync(bundledServiceDir)) {
        fs.rmSync(bundledServiceDir, { recursive: true, force: true });
    }

    fs.mkdirSync(bundledServiceDir, { recursive: true });

    copyRecursive(serviceDistDir, path.join(bundledServiceDir, 'dist'));
    copyRecursive(servicePackageJson, path.join(bundledServiceDir, 'package.json'));
    copyRecursive(servicePackageLock, path.join(bundledServiceDir, 'package-lock.json'));
    copyRecursive(governanceSourceDir, path.join(bundledServiceDir, 'governance'));

    console.log('Installing bundled service production dependencies...');
    runCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--omit=dev', '--ignore-scripts'], bundledServiceDir);

    console.log(`Bundled service prepared at ${bundledServiceDir}`);
}

main();