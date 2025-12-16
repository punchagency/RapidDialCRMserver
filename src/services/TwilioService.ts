import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

/**
 * Twilio Service Class
 * Handles all Twilio-related operations
 */
export class TwilioService {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private phoneNumber: string | undefined;
  private twimlAppSid: string | undefined;
  private client: ReturnType<typeof twilio> | null = null;
  private AccessToken: typeof twilio.jwt.AccessToken;
  private VoiceGrant: typeof twilio.jwt.AccessToken.VoiceGrant;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.apiKey = process.env.TWILIO_API_KEY;
    this.apiSecret = process.env.TWILIO_API_SECRET;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    const missingCredentials: string[] = [];
    if (!this.accountSid) missingCredentials.push("TWILIO_ACCOUNT_SID");
    if (!this.authToken) missingCredentials.push("TWILIO_AUTH_TOKEN");
    if (!this.apiKey) missingCredentials.push("TWILIO_API_KEY");
    if (!this.apiSecret) missingCredentials.push("TWILIO_API_SECRET");
    if (!this.phoneNumber) missingCredentials.push("TWILIO_PHONE_NUMBER");

    if (missingCredentials.length > 0) {
      console.warn(
        `Twilio credentials not fully configured. Missing: ${missingCredentials.join(
          ", "
        )}`
      );
    }

    if (!this.twimlAppSid) {
      console.warn(
        "TWILIO_TWIML_APP_SID not configured - browser calling will not work"
      );
    }

    this.client =
      this.accountSid && this.authToken
        ? twilio(this.accountSid, this.authToken)
        : null;
    this.AccessToken = twilio.jwt.AccessToken;
    this.VoiceGrant = this.AccessToken.VoiceGrant;
  }

  /**
   * Check if Twilio is fully configured
   */
  isConfigured(): boolean {
    return !!(
      this.accountSid &&
      this.authToken &&
      this.apiKey &&
      this.apiSecret &&
      this.phoneNumber
    );
  }

  /**
   * Check if Twilio Voice (browser calling) is configured
   */
  isVoiceConfigured(): boolean {
    return this.isConfigured() && !!this.twimlAppSid;
  }

  /**
   * Generate Twilio access token for browser calling
   */
  generateAccessToken(identity: string): string {
    if (!this.accountSid || !this.apiKey || !this.apiSecret) {
      throw new Error(
        "Twilio credentials not configured. Missing: " +
          [
            !this.accountSid && "TWILIO_ACCOUNT_SID",
            !this.apiKey && "TWILIO_API_KEY",
            !this.apiSecret && "TWILIO_API_SECRET",
          ]
            .filter(Boolean)
            .join(", ")
      );
    }

    if (!this.twimlAppSid) {
      throw new Error(
        "TWILIO_TWIML_APP_SID not configured. Create a TwiML app in Twilio Console."
      );
    }

    const accessToken = new this.AccessToken(
      this.accountSid,
      this.apiKey,
      this.apiSecret,
      {
        identity,
        ttl: 3600, // 1 hour
      }
    );

    const voiceGrant = new this.VoiceGrant({
      outgoingApplicationSid: this.twimlAppSid,
      incomingAllow: true,
    });

    accessToken.addGrant(voiceGrant);

    return accessToken.toJwt();
  }

  /**
   * Make an outbound call from server (for server-initiated calls)
   * Note: For browser calls, use Twilio Client SDK on frontend instead
   */
  async makeOutboundCall(to: string, callerId?: string): Promise<any> {
    if (!this.client) {
      throw new Error("Twilio client not initialized");
    }

    const from = callerId || this.phoneNumber;
    if (!from) {
      throw new Error("No phone number configured for outbound calls");
    }

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : process.env.API_BASE_URL || "http://localhost:5000";

    const call = await this.client.calls.create({
      to,
      from,
      url: `${baseUrl}/api/twilio/voice`,
    });

    return call;
  }

  /**
   * Get TwiML for outbound calls
   */
  getTwiMLForOutboundCall(to: string): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    const dial = response.dial({
      callerId: this.phoneNumber || undefined,
      timeout: 30,
    });

    dial.number(to);

    return response.toString();
  }

  /**
   * Get TwiML for browser-initiated calls
   * This is what gets called when frontend uses Twilio Client SDK
   */
  getTwiMLForBrowserCall(to: string, from?: string): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (to) {
      const baseUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : process.env.API_BASE_URL || "http://localhost:5000";

      const dial = response.dial({
        callerId: from || this.phoneNumber || undefined,
        timeout: 30,
        answerOnBridge: true,
      });
      dial.number(
        {
          statusCallbackEvent: [
            "initiated",
            "ringing",
            "answered",
            "completed",
          ],
          statusCallback: `${baseUrl}/api/twilio/status`,
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
  async getCallDetails(callSid: string): Promise<any> {
    if (!this.client) {
      throw new Error("Twilio client not initialized");
    }

    try {
      const call = await this.client.calls(callSid).fetch();
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

  /**
   * Get Twilio client instance
   */
  getClient(): ReturnType<typeof twilio> | null {
    return this.client;
  }

  /**
   * Get configured phone number
   */
  getPhoneNumber(): string | undefined {
    return this.phoneNumber;
  }
}

// Singleton instance
let twilioServiceInstance: TwilioService | null = null;

/**
 * Get singleton instance of TwilioService
 */
export function getTwilioService(): TwilioService {
  if (!twilioServiceInstance) {
    twilioServiceInstance = new TwilioService();
  }
  return twilioServiceInstance;
}

// Legacy exports for backward compatibility
// export const isTwilioConfigured = (): boolean =>
//   getTwilioService().isConfigured();
// export const isTwilioVoiceConfigured = (): boolean =>
//   getTwilioService().isVoiceConfigured();
// export const generateAccessToken = (identity: string): string =>
//   getTwilioService().generateAccessToken(identity);
// export const makeOutboundCall = (to: string, callerId?: string): Promise<any> =>
//   getTwilioService().makeOutboundCall(to, callerId);
// export const getTwiMLForOutboundCall = (to: string): string =>
//   getTwilioService().getTwiMLForOutboundCall(to);
// export const getTwiMLForBrowserCall = (to: string, from?: string): string =>
//   getTwilioService().getTwiMLForBrowserCall(to, from);
// export const getCallDetails = (callSid: string): Promise<any> =>
//   getTwilioService().getCallDetails(callSid);
// export const client = getTwilioService().getClient();
// export const phoneNumber = getTwilioService().getPhoneNumber();
