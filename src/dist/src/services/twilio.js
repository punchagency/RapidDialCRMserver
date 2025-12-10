import twilio from "twilio";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
const missingCredentials = [];
if (!accountSid)
    missingCredentials.push("TWILIO_ACCOUNT_SID");
if (!authToken)
    missingCredentials.push("TWILIO_AUTH_TOKEN");
if (!apiKey)
    missingCredentials.push("TWILIO_API_KEY");
if (!apiSecret)
    missingCredentials.push("TWILIO_API_SECRET");
if (!phoneNumber)
    missingCredentials.push("TWILIO_PHONE_NUMBER");
if (missingCredentials.length > 0) {
    console.warn(`Twilio credentials not fully configured. Missing: ${missingCredentials.join(", ")}`);
}
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
export function generateAccessToken(identity) {
    if (!accountSid || !apiKey || !apiSecret) {
        throw new Error("Twilio credentials not configured. Missing: " +
            [!accountSid && "TWILIO_ACCOUNT_SID", !apiKey && "TWILIO_API_KEY", !apiSecret && "TWILIO_API_SECRET"]
                .filter(Boolean).join(", "));
    }
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, { identity });
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
        incomingAllow: true,
    });
    accessToken.addGrant(voiceGrant);
    return accessToken.toJwt();
}
export async function makeOutboundCall(to, callerId) {
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
        url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/twilio/voice`,
    });
    return call;
}
export function getTwiMLForOutboundCall(to) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    const dial = response.dial({
        callerId: phoneNumber || undefined,
        timeout: 30,
    });
    dial.number(to);
    return response.toString();
}
export function getTwiMLForBrowserCall(to) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    if (to) {
        const dial = response.dial({
            callerId: phoneNumber || undefined,
            timeout: 30,
            answerOnBridge: true,
        });
        dial.number({
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallback: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/twilio/status`,
        }, to);
    }
    else {
        response.say("No phone number provided");
    }
    return response.toString();
}
export { client, phoneNumber };
//# sourceMappingURL=twilio.js.map