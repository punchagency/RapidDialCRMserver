/**
 * Service Types
 */

export interface CreateIssueParams {
  title: string;
  description?: string;
  priority?: number;
  labelIds?: string[];
}

