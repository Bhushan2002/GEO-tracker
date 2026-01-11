import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export const getGtmClient = (accessToken: string, refreshToken: string) => {
    const auth = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GA_CLIENT_ID,
        process.env.GA_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    return google.tagmanager({ version: 'v2', auth });
};



async function findEntityByName(list: any[], name: string, idKey: string) {
    if (!list || list.length === 0) return null;
    const found = list.find((item: any) => item.name === name);
    return found ? found[idKey] : null;
}

/**
 * Automates the GTM setup for AI Overviews
 */
export async function setupGtmTracking(
    accessToken: string,
    refreshToken: string,
    gtmAccountId: string,
    gtmContainerId: string,
    measurementId: string
) {
    const tagmanager = getGtmClient(accessToken, refreshToken);


    const containerPath = `accounts/${gtmAccountId}/containers/${gtmContainerId}`;




    // 1. Get the Default Workspace
    const workspaces = await tagmanager.accounts.containers.workspaces.list({
        parent: containerPath,
    });


    const workspaceId = workspaces.data.workspace?.[0]?.workspaceId;
    if (!workspaceId) throw new Error("No workspace found in this container");

    const parent = `accounts/${gtmAccountId}/containers/${gtmContainerId}/workspaces/${workspaceId}`;

    // 2. Create Variable: JS - URL Fragment Match

    console.log("Creating Variable...");

    const varName = "JS - URL Fragment Match";
    let variableId: string | null = null;
    const varList = await tagmanager.accounts.containers.workspaces.variables.list({ parent });
    variableId = await findEntityByName(varList.data.variable || [], varName, 'variableId');

    if (!variableId) {
        console.log(`Creating Variable: ${varName}`);
        const res = await tagmanager.accounts.containers.workspaces.variables.create({
            parent,
            requestBody: {
                name: varName,
                type: "jsm", // Custom JavaScript
                parameter: [{
                    type: "template",
                    key: "javascript",
                    value: "function() { try { return performance.getEntries()[0].name.includes(\"#:~:text=\"); } catch (e) { return false; } }"
                }]
            }
        });
        variableId = res.data.variableId!;
    } else {
        console.log(`Variable '${varName}' already exists. Reusing ID: ${variableId}`);
    }

    // 3. Create Trigger: AI Overview Trigger
    const triggerName = "AI Overview Trigger";
    let triggerId: string | null = null;

    const triggerList = await tagmanager.accounts.containers.workspaces.triggers.list({ parent });
    triggerId = await findEntityByName(triggerList.data.trigger || [], triggerName, 'triggerId');

    if (!triggerId) {
        console.log(`Creating Trigger: ${triggerName}`);
        const res = await tagmanager.accounts.containers.workspaces.triggers.create({
            parent,
            requestBody: {
                name: triggerName,
                type: "domReady",
                filter: [{
                    type: "equals",
                    parameter: [
                        // GTM uses {{Variable Name}} to reference variables
                        { type: "template", key: "arg0", value: `{{${varName}}}` },
                        { type: "template", key: "arg1", value: "true" }
                    ]
                }]
            }
        });
        triggerId = res.data.triggerId!;
    } else {
        console.log(`Trigger '${triggerName}' already exists. Reusing ID: ${triggerId}`);
    }
    // 4. Create Tag: GA4 Event
    const tagName = "GA4 Event - ai_overview_click";

    const tagList = await tagmanager.accounts.containers.workspaces.tags.list({ parent });
    const existingTagId = await findEntityByName(tagList.data.tag || [], tagName, 'tagId');

    // CRITICAL FIX: Define parameters with the exact keys GTM expects
    const tagParameters = [
        {
            type: "template",
            key: "eventName",
            value: "ai_overview_click"
        },
        {
            type: "template",
            key: "measurementId",
            value: measurementId
        },
        // The API error specifically demanded this parameter:
        {
            type: "template",
            key: "measurementIdOverride",
            value: measurementId
        }
    ];

    if (!existingTagId) {
        console.log(`Creating Tag: ${tagName}`);
        await tagmanager.accounts.containers.workspaces.tags.create({
            parent,
            requestBody: {
                name: tagName,
                type: "gaawe", // GA4 Event Tag Type
                parameter: tagParameters,
                firingTriggerId: [triggerId!]
            }
        });
    } else {
        console.log(`Tag '${tagName}' already exists. Updating configuration...`);
        await tagmanager.accounts.containers.workspaces.tags.update({
            path: `${parent}/tags/${existingTagId}`,
            requestBody: {
                name: tagName,
                type: "gaawe",
                parameter: tagParameters,
                firingTriggerId: [triggerId!]
            }
        });
    }
    // 5. Publish (Optional: Remove this if you want to Review only)
    // await tagmanager.accounts.containers.versions.publish({ parent });

    return { success: true, workspaceId: workspaceId, status: "Configured" };
}