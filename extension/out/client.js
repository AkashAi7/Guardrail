"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailClient = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
class GuardrailClient {
    constructor() {
        const config = vscode.workspace.getConfiguration('codeGuardrail');
        this.baseURL = config.get('serviceUrl', 'http://localhost:3000');
        this.client = axios_1.default.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    updateConfig(baseURL) {
        this.baseURL = baseURL;
        this.client.defaults.baseURL = baseURL;
    }
    async checkHealth() {
        try {
            const response = await this.client.get('/api/health');
            return response.status === 200 && response.data.status === 'healthy';
        }
        catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
    async getInfo() {
        const response = await this.client.get('/api/info');
        return response.data;
    }
    async analyzeCode(code, language, filename) {
        const response = await this.client.post('/api/analyze', {
            code,
            language,
            filename
        });
        return response.data;
    }
    async analyzeBatch(files) {
        const response = await this.client.post('/api/analyze-batch', { files });
        return response.data.results;
    }
    async reloadGovernance() {
        await this.client.post('/api/reload-governance');
    }
}
exports.GuardrailClient = GuardrailClient;
//# sourceMappingURL=client.js.map