// src/lib/env-check.ts
// This file helps debug environment variable issues in production

export function checkEnvVars() {
    const required = [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'DATABASE_URL',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        console.error('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET')));
    }
    
    return missing.length === 0;
}

// Check on load
if (typeof window === 'undefined') {
    checkEnvVars();
}
