import { LinearClient } from '@linear/sdk';
export declare function getLinearClient(): Promise<LinearClient>;
export interface CreateIssueParams {
    title: string;
    description?: string;
    priority?: number;
    labelIds?: string[];
}
export declare function createLinearIssue(params: CreateIssueParams): Promise<import("@linear/sdk").IssuePayload>;
export declare function getLinearTeams(): Promise<import("@linear/sdk").Team[]>;
export declare function getLinearIssues(teamId?: string): Promise<import("@linear/sdk").Issue[]>;
export declare function getLinearLabels(teamId: string): Promise<import("@linear/sdk").IssueLabel[]>;
export declare function uploadAttachmentToLinear(issueId: string, url: string, title: string): Promise<import("@linear/sdk").AttachmentPayload>;
//# sourceMappingURL=linear.d.ts.map