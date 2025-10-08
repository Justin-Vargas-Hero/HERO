// src/lib/get-secret.ts
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

let cachedSecret: string | null = null;

export async function getNextAuthSecret(): Promise<string> {
    // Return hardcoded secret for now until Parameter Store is set up
    return '51329660874c337103ba1313c4f1125afc4ec27e33874533fee9c58a1a3';
    
    /* Uncomment when Parameter Store is configured:
    if (cachedSecret) return cachedSecret;
    
    try {
        const client = new SSMClient({ region: process.env.REGION || 'us-east-1' });
        const command = new GetParameterCommand({
            Name: '/amplify/hero/master/NEXTAUTH_SECRET',
            WithDecryption: true,
        });
        const response = await client.send(command);
        cachedSecret = response.Parameter?.Value || '';
        return cachedSecret;
    } catch (error) {
        console.error('Failed to get secret from Parameter Store:', error);
        // Fallback
        return '51329660874c337103ba1313c4f1125afc4ec27e33874533fee9c58a1a3';
    }
    */
}
