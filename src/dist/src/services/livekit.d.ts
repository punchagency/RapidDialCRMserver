declare const apiKey: string | undefined;
declare const apiSecret: string | undefined;
export declare function isLiveKitConfigured(): boolean;
export declare function getLiveKitUrl(): string;
export declare function generateLiveKitToken(identity: string, roomName: string, options?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    name?: string;
}): Promise<string>;
export declare function generateCallRoomName(callerId: string, calleePhone: string): string;
export declare function generateSIPToken(identity: string, roomName: string, phoneNumber: string): Promise<string>;
export { apiKey, apiSecret };
//# sourceMappingURL=livekit.d.ts.map