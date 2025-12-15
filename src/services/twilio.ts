import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

const missingCredentials: string[] = [];
if (!accountSid) missingCredentials.push("TWILIO_ACCOUNT_SID");
if (!authToken) missingCredentials.push("TWILIO_AUTH_TOKEN");
if (!apiKey) missingCredentials.push("TWILIO_API_KEY");
if (!apiSecret) missingCredentials.push("TWILIO_API_SECRET");
if (!phoneNumber) missingCredentials.push("TWILIO_PHONE_NUMBER");

if (missingCredentials.length > 0) {
  console.warn(
    `Twilio credentials not fully configured. Missing: ${missingCredentials.join(
      ", "
    )}`
  );
}

if (!twimlAppSid) {
  console.warn(
    "TWILIO_TWIML_APP_SID not configured - browser calling will not work"
  );
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

/**
 * Check if Twilio is fully configured
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && apiKey && apiSecret && phoneNumber);
}

/**
 * Check if Twilio Voice (browser calling) is configured
 */
export function isTwilioVoiceConfigured(): boolean {
  return isTwilioConfigured() && !!twimlAppSid;
}

/**
 * Generate Twilio access token for browser calling
 */
export function generateAccessToken(identity: string): string {
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error(
      "Twilio credentials not configured. Missing: " +
        [
          !accountSid && "TWILIO_ACCOUNT_SID",
          !apiKey && "TWILIO_API_KEY",
          !apiSecret && "TWILIO_API_SECRET",
        ]
          .filter(Boolean)
          .join(", ")
    );
  }

  if (!twimlAppSid) {
    throw new Error(
      "TWILIO_TWIML_APP_SID not configured. Create a TwiML app in Twilio Console."
    );
  }

  const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600, // 1 hour
  });

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  accessToken.addGrant(voiceGrant);

  return accessToken.toJwt();
}

/**
 * Make an outbound call from server (for server-initiated calls)
 * Note: For browser calls, use Twilio Client SDK on frontend instead
 */
export async function makeOutboundCall(
  to: string,
  callerId?: string
): Promise<any> {
  if (!client) {
    throw new Error("Twilio client not initialized");
  }

  const from = callerId || phoneNumber;
  if (!from) {
    throw new Error("No phone number configured for outbound calls");
  }

  const call = await client.calls.create({
    to,
    from,
    url: `${
      process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "http://localhost:5000"
    }/api/twilio/voice`,
  });

  return call;
}

/**
 * Get TwiML for outbound calls
 */
export function getTwiMLForOutboundCall(to: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const dial = response.dial({
    callerId: phoneNumber || undefined,
    timeout: 30,
  });

  dial.number(to);

  return response.toString();
}

/**
 * Get TwiML for browser-initiated calls
 * This is what gets called when frontend uses Twilio Client SDK
 */
export function getTwiMLForBrowserCall(to: string, from?: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (to) {
    const dial = response.dial({
      callerId: from || phoneNumber || undefined,
      timeout: 30,
      answerOnBridge: true,
    });
    dial.number(
      {
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallback: `${
          process.env.REPLIT_DOMAINS
            ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
            : "http://localhost:5000"
        }/api/twilio/status`,
      },
      to
    );
  } else {
    response.say("No phone number provided");
  }

  return response.toString();
}

/**
 * Get call details from Twilio
 */
export async function getCallDetails(callSid: string): Promise<any> {
  if (!client) {
    throw new Error("Twilio client not initialized");
  }

  try {
    const call = await client.calls(callSid).fetch();
    return {
      sid: call.sid,
      status: call.status,
      duration: call.duration,
      from: call.from,
      to: call.to,
      startTime: call.startTime,
      endTime: call.endTime,
    };
  } catch (error) {
    console.error("Failed to fetch call details:", error);
    throw error;
  }
}

export { client, phoneNumber };
