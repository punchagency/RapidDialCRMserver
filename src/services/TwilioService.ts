import twilio from "twilio";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import { join } from "path";
import { getS3Service } from "./S3Service.js";

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
  getTwiMLForBrowserCall(
    to: string,
    from?: string,
    prospectId?: string
  ): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (to) {
      const baseUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : process.env.API_BASE_URL || "http://localhost:5000";

      // Build callback URLs with parameters
      const encodedPhone = encodeURIComponent(to);
      const recordingCallbackUrl = prospectId
        ? `${baseUrl}/api/v1/twilio/recording?phoneNumber=${encodedPhone}&prospectId=${encodeURIComponent(
            prospectId
          )}`
        : `${baseUrl}/api/v1/twilio/recording?phoneNumber=${encodedPhone}`;

      const dial = response.dial({
        callerId: from || this.phoneNumber || undefined,
        timeout: 30,
        answerOnBridge: true,
        record: "record-from-answer-dual",
        recordingStatusCallbackMethod: "POST",
        recordingStatusCallback: recordingCallbackUrl,
      });
      dial.number(
        {
          statusCallbackEvent: [
            "initiated",
            "ringing",
            "answered",
            "completed",
          ],
          statusCallback: `${baseUrl}/api/v1/twilio/status${
            prospectId ? `?prospectId=${encodeURIComponent(prospectId)}` : ""
          }`,
        },

        to
      );
    } else {
      response.say("No phone number provided");
    }

    return response.toString();
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

  /**
   * Download call recording from Twilio
   * @param recordingUrl - URL of the recording from Twilio
   * @param callSid - Twilio call SID
   * @param phoneNumber - Phone number to include in filename (optional)
   * @returns Object with local file path and S3 key
   */
  async downloadRecording(
    recordingUrl: string,
    callSid: string,
    phoneNumber?: string
  ): Promise<{ localFilePath: string; key: string }> {
    if (!this.accountSid || !this.authToken) {
      throw new Error("Twilio credentials not configured");
    }

    try {
      // Use /tmp for production environments (cloud platforms), local path for development
      const callRecordingsDir =
        process.env.NODE_ENV === "production"
          ? join("/tmp", "call-recordings")
          : join(process.cwd(), "call-recordings");

      // Create directory if it doesn't exist
      if (!fs.existsSync(callRecordingsDir)) {
        fs.mkdirSync(callRecordingsDir, { recursive: true });
      }

      // Download recording from Twilio with authentication
      const response = await axios.get(recordingUrl, {
        auth: {
          username: this.accountSid,
          password: this.authToken,
        },
        responseType: "arraybuffer",
      });

      // Create descriptive filename
      let uniqueFileName: string;
      if (phoneNumber) {
        const now = new Date();
        const timestamp = now
          .toISOString()
          .replace(/T/, " ")
          .replace(/\..+/, "")
          .replace(/:/g, "-");

        // Clean phone number for filename (remove special characters)
        const cleanPhone = phoneNumber.replace(/[^\d]/g, "");
        const formattedPhone =
          cleanPhone.length === 11 && cleanPhone.startsWith("1")
            ? `(${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(
                4,
                7
              )}-${cleanPhone.slice(7)}`
            : cleanPhone.length === 10
            ? `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(
                3,
                6
              )}-${cleanPhone.slice(6)}`
            : phoneNumber;

        uniqueFileName = `Call_recording_of_${formattedPhone}_at_${timestamp}.mp3`;
      } else {
        // Fallback to callSid-timestamp format
        uniqueFileName = `${callSid}-${Date.now()}.mp3`;
      }

      const localFilePath = join(callRecordingsDir, uniqueFileName);

      // Save file locally
      fs.writeFileSync(localFilePath, response.data);
      // console.log(`Recording downloaded: ${localFilePath}`);

      return { localFilePath, key: uniqueFileName };
    } catch (error) {
      console.error("Error downloading recording from Twilio:", error);
      throw error;
    }
  }

  /**
   * Process recording: download from Twilio, upload to S3, cleanup local file
   * @param recordingUrl - URL of the recording from Twilio
   * @param callSid - Twilio call SID
   * @param phoneNumber - Phone number to include in filename (optional)
   * @returns S3 URL of the uploaded recording
   */
  async processRecording(
    recordingUrl: string,
    callSid: string,
    phoneNumber?: string
  ): Promise<string> {
    let localFilePath: string | null = null;

    try {
      // Step 1: Download recording from Twilio
      const downloadResult = await this.downloadRecording(
        recordingUrl,
        callSid,
        phoneNumber
      );
      localFilePath = downloadResult.localFilePath;
      const key = downloadResult.key;

      // Step 2: Upload to S3
      const s3Service = getS3Service();
      if (!s3Service.isConfigured()) {
        throw new Error("S3 service not configured");
      }

      const s3Url = await s3Service.uploadFile(
        localFilePath,
        key,
        "call-recordings"
      );
      console.log(`Recording uploaded to S3: ${s3Url}`);

      // Step 3: Cleanup local file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`Local file deleted: ${localFilePath}`);
      }

      return s3Url;
    } catch (error) {
      // Cleanup local file on error
      if (localFilePath && fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
          console.log(`Cleaned up local file after error: ${localFilePath}`);
        } catch (cleanupError) {
          console.error("Error cleaning up local file:", cleanupError);
        }
      }
      throw error;
    }
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
