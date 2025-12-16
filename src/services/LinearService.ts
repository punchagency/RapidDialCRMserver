import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import { CreateIssueParams } from './types.js';

dotenv.config();

/**
 * Linear Service Class
 * Handles Linear API integration for issue tracking
 */
export class LinearService {
  private connectionSettings: any = null;

  /**
   * Get Linear access token from Replit connectors
   */
  private async getAccessToken(): Promise<string | null> {
    if (
      this.connectionSettings &&
      this.connectionSettings.settings.expires_at &&
      new Date(this.connectionSettings.settings.expires_at).getTime() > Date.now()
    ) {
      return this.connectionSettings.settings.access_token;
    }

    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? 'repl ' + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
        ? 'depl ' + process.env.WEB_REPL_RENEWAL
        : null;

    if (!xReplitToken || !hostname) {
      console.warn('Linear not configured: Replit connectors not available');
      return null;
    }

    try {
      this.connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=linear',
        {
          headers: {
            Accept: 'application/json',
            X_REPLIT_TOKEN: xReplitToken,
          },
        }
      )
        .then((res) => res.json())
        .then((data: any) => data.items?.[0]);

      const accessToken =
        this.connectionSettings?.settings?.access_token ||
        this.connectionSettings.settings?.oauth?.credentials?.access_token;

      if (!this.connectionSettings || !accessToken) {
        console.warn('Linear not connected');
        return null;
      }
      return accessToken;
    } catch (error) {
      console.warn('Failed to get Linear access token:', error);
      return null;
    }
  }

  /**
   * Get Linear client instance
   */
  async getLinearClient(): Promise<LinearClient | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return null;
    }
    return new LinearClient({ accessToken });
  }

  /**
   * Create issue parameters interface
   */
  

  /**
   * Create a Linear issue
   */
  async createLinearIssue(params: CreateIssueParams) {
    const client = await this.getLinearClient();
    if (!client) {
      throw new Error('Linear not configured');
    }

    const me = await client.viewer;
    const teams = await client.teams();
    const team = teams.nodes[0];

    if (!team) {
      throw new Error('No Linear team found');
    }

    const issue = await client.createIssue({
      teamId: team.id,
      title: params.title,
      description: params.description,
      priority: params.priority || 2,
      labelIds: params.labelIds,
    });

    return issue;
  }

  /**
   * Get Linear teams
   */
  async getLinearTeams() {
    const client = await this.getLinearClient();
    if (!client) {
      return [];
    }
    const teams = await client.teams();
    return teams.nodes;
  }

  /**
   * Get Linear issues
   */
  async getLinearIssues(teamId?: string) {
    const client = await this.getLinearClient();
    if (!client) {
      return [];
    }

    if (teamId) {
      const team = await client.team(teamId);
      const issues = await team.issues();
      return issues.nodes;
    }

    const issues = await client.issues();
    return issues.nodes;
  }

  /**
   * Get Linear labels
   */
  async getLinearLabels(teamId: string) {
    const client = await this.getLinearClient();
    if (!client) {
      return [];
    }
    const team = await client.team(teamId);
    const labels = await team.labels();
    return labels.nodes;
  }

  /**
   * Upload attachment to Linear
   */
  async uploadAttachmentToLinear(issueId: string, url: string, title: string) {
    const client = await this.getLinearClient();
    if (!client) {
      throw new Error('Linear not configured');
    }

    const attachment = await client.createAttachment({
      issueId,
      url,
      title,
    });

    return attachment;
  }
}

// Singleton instance
let linearServiceInstance: LinearService | null = null;

/**
 * Get singleton instance of LinearService
 */
export function getLinearService(): LinearService {
  if (!linearServiceInstance) {
    linearServiceInstance = new LinearService();
  }
  return linearServiceInstance;
}

