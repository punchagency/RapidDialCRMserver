import { AccessToken, SipClient } from "livekit-server-sdk";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl =
  process.env.LIVEKIT_URL || "wss://your-project.livekit.cloud";
const sipTrunkId = process.env.LIVEKIT_SIP_TRUNK_ID;

const missingCredentials: string[] = [];
if (!apiKey) missingCredentials.push("LIVEKIT_API_KEY");
if (!apiSecret) missingCredentials.push("LIVEKIT_API_SECRET");

if (missingCredentials.length > 0) {
  console.warn(
    `LiveKit credentials not fully configured. Missing: ${missingCredentials.join(
      ", "
    )}`
  );
}

if (!sipTrunkId) {
  console.warn(
    "LIVEKIT_SIP_TRUNK_ID not configured - phone calls will not work"
  );
}

export function isLiveKitConfigured(): boolean {
  return !!(apiKey && apiSecret);
}

export function isSipConfigured(): boolean {
  return !!(apiKey && apiSecret && sipTrunkId);
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

export function generateCallRoomName(
  callerId: string,
  calleePhone: string
): string {
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

/**
 * Create a SIP participant to dial an outbound phone call
 * This is what actually makes the phone ring!
 */
export async function createSipParticipant(
  roomName: string,
  phoneNumber: string,
  options?: {
    participantIdentity?: string;
    participantName?: string;
    playRingtone?: boolean;
  }
): Promise<any> {
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured");
  }

  if (!sipTrunkId) {
    throw new Error(
      "LIVEKIT_SIP_TRUNK_ID not configured. Please set up a SIP trunk in LiveKit Cloud and add the trunk ID to your .env file"
    );
  }

  // Remove the wss:// or https:// prefix to get the hostname for SIP client
  const httpUrl = livekitUrl
    .replace(/^wss:\/\//, "https://")
    .replace(/^ws:\/\//, "http://");

  const sipClient = new SipClient(httpUrl, apiKey, apiSecret);

  try {
    const sipParticipant = await sipClient.createSipParticipant(
      sipTrunkId,
      phoneNumber,
      roomName,
      {
        participantIdentity:
          options?.participantIdentity ||
          `sip-${phoneNumber.replace(/\D/g, "")}`,
        participantName: options?.participantName || `Phone: ${phoneNumber}`,
        playRingtone: options?.playRingtone ?? true,
      }
    );

    console.log(
      `✅ SIP participant created for ${phoneNumber} in room ${roomName}`
    );
    return sipParticipant;
  } catch (error) {
    console.error("Failed to create SIP participant:", error);
    throw error;
  }
}

export { apiKey, apiSecret };
