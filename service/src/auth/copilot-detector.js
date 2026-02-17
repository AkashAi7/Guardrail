/**
 * Copilot Auto-Detector
 * Detects if user has GitHub Copilot installed and authenticated
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { CopilotClient } from '@github/copilot-sdk';
export class CopilotDetector {
    static CLI_PATHS = [
        // VS Code global storage
        join(process.env.APPDATA || '', 'Code/User/globalStorage/github.copilot-chat/copilotCli'),
        // VS Code Insiders
        join(process.env.APPDATA || '', 'Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli'),
        // GitHub CLI
        join(homedir(), '.config/gh/copilot'),
        // Linux/macOS
        join(homedir(), '.local/share/code/User/globalStorage/github.copilot-chat/copilotCli'),
        join(homedir(), 'Library/Application Support/Code/User/globalStorage/github.copilot-chat/copilotCli')
    ];
    async detect() {
        console.log('🔍 Detecting GitHub Copilot installation...');
        // Step 1: Find CLI executable
        const cliPath = this.findCopilotCli();
        if (!cliPath) {
            console.log('❌ Copilot CLI not found');
            return {
                available: false,
                authenticated: false,
                subscriptionType: null
            };
        }
        console.log(`✅ Found Copilot CLI at: ${cliPath}`);
        // Step 2: Test if CLI is functional and authenticated
        const isAuthenticated = await this.testAuthentication();
        if (!isAuthenticated) {
            console.log('⚠️ Copilot CLI found but not authenticated');
            return {
                available: true,
                cliPath,
                authenticated: false,
                subscriptionType: null
            };
        }
        console.log('✅ Copilot is authenticated and ready');
        return {
            available: true,
            cliPath,
            authenticated: true,
            subscriptionType: 'individual' // Could be enhanced to detect actual type
        };
    }
    findCopilotCli() {
        for (const basePath of CopilotDetector.CLI_PATHS) {
            // Windows
            const psPath = join(basePath, 'copilot.ps1');
            if (existsSync(psPath)) {
                return psPath;
            }
            // Unix-like systems
            const shPath = join(basePath, 'copilot');
            if (existsSync(shPath)) {
                return shPath;
            }
        }
        return null;
    }
    async testAuthentication() {
        try {
            // Try to initialize Copilot client
            const client = new CopilotClient();
            // Start the client (this will fail if not authenticated)
            await client.start();
            // If we get here, authentication is valid
            await client.stop();
            return true;
        }
        catch (error) {
            // Check if error is authentication-related
            if (error.message?.includes('auth') ||
                error.message?.includes('token') ||
                error.message?.includes('login')) {
                return false;
            }
            // Other errors might still mean CLI is available
            // but we'll be conservative and return false
            console.error('Error testing Copilot authentication:', error.message);
            return false;
        }
    }
    /**
     * Check if auth token file exists (quick check without spawning process)
     */
    hasAuthToken() {
        const tokenPaths = [
            join(process.env.APPDATA || '', 'Code/User/globalStorage/github.copilot-chat/.github-auth-token'),
            join(process.env.APPDATA || '', 'Code/User/globalStorage/github.copilot/.github-auth-token'),
            join(homedir(), '.local/share/code/User/globalStorage/github.copilot-chat/.github-auth-token'),
            join(homedir(), 'Library/Application Support/Code/User/globalStorage/github.copilot-chat/.github-auth-token')
        ];
        return tokenPaths.some(path => existsSync(path));
    }
    /**
     * Get quick status without full detection (for status bar, etc.)
     */
    getQuickStatus() {
        return {
            hasCliInstalled: this.findCopilotCli() !== null,
            hasToken: this.hasAuthToken()
        };
    }
}
