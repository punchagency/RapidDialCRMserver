declare const phoneNumber: string | undefined;
declare const client: import("twilio/lib/rest/Twilio") | null;
export declare function generateAccessToken(identity: string): string;
export declare function makeOutboundCall(to: string, callerId?: string): Promise<any>;
export declare function getTwiMLForOutboundCall(to: string): string;
export declare function getTwiMLForBrowserCall(to: string): string;
export { client, phoneNumber };
//# sourceMappingURL=twilio.d.ts.map