import { AccessToken } from "livekit-server-sdk";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL || "wss://your-project.livekit.cloud";

const missingCredentials: string[] = [];
if (!apiKey) missingCredentials.push("LIVEKIT_API_KEY");
if (!apiSecret) missingCredentials.push("LIVEKIT_API_SECRET");

if (missingCredentials.length > 0) {
  console.warn(`LiveKit credentials not fully configured. Missing: ${missingCredentials.join(", ")}`);
}

export function isLiveKitConfigured(): boolean {
  return !!(apiKey && apiSecret);
}

export function getLiveKitUrl(): string {
  return livekitUrl;
}

export async function generateLiveKitToken(
  identity: string,
  roomName: string,
  options?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    name?: string;
  }
): Promise<string> {
  if (!apiKey || !apiSecret) {
    throw new Error(
      "LiveKit credentials not configured. Missing: " +
        [!apiKey && "LIVEKIT_API_KEY", !apiSecret && "LIVEKIT_API_SECRET"]
          .filter(Boolean)
          .join(", ")
    );
  }

  const token = new AccessToken(apiKey, apiSecret, {
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

export function generateCallRoomName(callerId: string, calleePhone: string): string {
  const timestamp = Date.now();
  const sanitizedPhone = calleePhone.replace(/[^0-9]/g, "");
  return `call_${callerId}_${sanitizedPhone}_${timestamp}`;
}

export async function generateSIPToken(
  identity: string,
  roomName: string,
  phoneNumber: string
): Promise<string> {
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured");
  }

  const token = new AccessToken(apiKey, apiSecret, {
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

export { apiKey, apiSecret };
