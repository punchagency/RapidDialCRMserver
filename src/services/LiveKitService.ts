import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * LiveKit Service Class
 * Handles all LiveKit-related operations
 */
export class LiveKitService {
 private apiKey: string | undefined;
 private apiSecret: string | undefined;
 private livekitUrl: string;

 constructor() {
  this.apiKey = process.env.LIVEKIT_API_KEY;
  this.apiSecret = process.env.LIVEKIT_API_SECRET;
  this.livekitUrl = process.env.LIVEKIT_URL || 'wss://your-project.livekit.cloud';

  const missingCredentials: string[] = [];
  if (!this.apiKey) missingCredentials.push('LIVEKIT_API_KEY');
  if (!this.apiSecret) missingCredentials.push('LIVEKIT_API_SECRET');

  if (missingCredentials.length > 0) {
   console.warn(`LiveKit credentials not fully configured. Missing: ${missingCredentials.join(', ')}`);
  }
 }

 /**
  * Check if LiveKit is configured
  */
 isConfigured(): boolean {
  return !!(this.apiKey && this.apiSecret);
 }

 /**
  * Get LiveKit URL
  */
 getLiveKitUrl(): string {
  return this.livekitUrl;
 }

 /**
  * Generate LiveKit token
  */
 async generateLiveKitToken(
  identity: string,
  roomName: string,
  options?: {
   canPublish?: boolean;
   canSubscribe?: boolean;
   name?: string;
  }
 ): Promise<string> {
  if (!this.apiKey || !this.apiSecret) {
   throw new Error(
    'LiveKit credentials not configured. Missing: ' +
    [!this.apiKey && 'LIVEKIT_API_KEY', !this.apiSecret && 'LIVEKIT_API_SECRET'].filter(Boolean).join(', ')
   );
  }

  const token = new AccessToken(this.apiKey, this.apiSecret, {
   identity,
   name: options?.name || identity,
  });

  token.addGrant({
   roomJoin: true,
   room: roomName,
   canPublish: options?.canPublish ?? true,
   canSubscribe: options?.canSubscribe ?? true,
   canPublishData: true,
  });

  return await token.toJwt();
 }

 /**
  * Generate call room name
  */
 generateCallRoomName(callerId: string, calleePhone: string): string {
  const timestamp = Date.now();
  const sanitizedPhone = calleePhone.replace(/[^0-9]/g, '');
  return `call_${callerId}_${sanitizedPhone}_${timestamp}`;
 }

 /**
  * Generate SIP token
  */
 async generateSIPToken(identity: string, roomName: string, phoneNumber: string): Promise<string> {
  if (!this.apiKey || !this.apiSecret) {
   throw new Error('LiveKit credentials not configured');
  }

  const token = new AccessToken(this.apiKey, this.apiSecret, {
   identity,
   name: `SIP Call to ${phoneNumber}`,
  });

  token.addGrant({
   roomJoin: true,
   room: roomName,
   canPublish: true,
   canSubscribe: true,
   canPublishData: true,
  });

  return await token.toJwt();
 }
}

// Singleton instance
let liveKitServiceInstance: LiveKitService | null = null;

/**
 * Get singleton instance of LiveKitService
 */
export function getLiveKitService(): LiveKitService {
 if (!liveKitServiceInstance) {
  liveKitServiceInstance = new LiveKitService();
 }
 return liveKitServiceInstance;
}

