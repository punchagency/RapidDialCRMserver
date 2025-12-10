export declare function getLinearClient(): Promise<any>;
export interface CreateIssueParams {
    title: string;
    description?: string;
    priority?: number;
    labelIds?: string[];
}
export declare function createLinearIssue(params: CreateIssueParams): Promise<any>;
export declare function getLinearTeams(): Promise<any>;
export declare function getLinearIssues(teamId?: string): Promise<any>;
export declare function getLinearLabels(teamId: string): Promise<any>;
export declare function uploadAttachmentToLinear(issueId: string, url: string, title: string): Promise<any>;
//# sourceMappingURL=linear.d.ts.map