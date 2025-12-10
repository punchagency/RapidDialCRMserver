import { LinearClient } from '@linear/sdk';
let connectionSettings;
async function getAccessToken() {
    if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
        return connectionSettings.settings.access_token;
    }
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
        ? 'repl ' + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
            ? 'depl ' + process.env.WEB_REPL_RENEWAL
            : null;
    if (!xReplitToken) {
        throw new Error('X_REPLIT_TOKEN not found for repl/depl');
    }
    connectionSettings = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=linear', {
        headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
        }
    }).then(res => res.json()).then(data => data.items?.[0]);
    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
    if (!connectionSettings || !accessToken) {
        throw new Error('Linear not connected');
    }
    return accessToken;
}
export async function getLinearClient() {
    const accessToken = await getAccessToken();
    return new LinearClient({ accessToken });
}
export async function createLinearIssue(params) {
    const client = await getLinearClient();
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
export async function getLinearTeams() {
    const client = await getLinearClient();
    const teams = await client.teams();
    return teams.nodes;
}
export async function getLinearIssues(teamId) {
    const client = await getLinearClient();
    if (teamId) {
        const team = await client.team(teamId);
        const issues = await team.issues();
        return issues.nodes;
    }
    const issues = await client.issues();
    return issues.nodes;
}
export async function getLinearLabels(teamId) {
    const client = await getLinearClient();
    const team = await client.team(teamId);
    const labels = await team.labels();
    return labels.nodes;
}
export async function uploadAttachmentToLinear(issueId, url, title) {
    const client = await getLinearClient();
    const attachment = await client.createAttachment({
        issueId,
        url,
        title,
    });
    return attachment;
}
//# sourceMappingURL=linear.js.map