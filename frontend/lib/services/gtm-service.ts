import { google } from 'googleapis';


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
                    value: "function() { try { return window.location.href.includes(\"#:~:text=\"); } catch (e) { return false; } }"
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
    // 5. Create a version from the workspace (OPTIONAL - requires tagmanager.publish scope)
    console.log("Creating version from workspace...");
    try {
        const versionResponse = await tagmanager.accounts.containers.workspaces.create_version({
            path: parent,
            requestBody: {
                name: "AI Overview Tracking Setup",
                notes: "Automated setup for AI Overview click tracking"
            }
        });

        const versionPath = versionResponse.data.containerVersion?.path;

        if (versionPath) {
            console.log("Version created successfully!", versionPath);

            // 6. Publish the version
            try {
                await tagmanager.accounts.containers.versions.publish({
                    path: versionPath
                });
                console.log("✅ Version published successfully!");
                return {
                    success: true,
                    workspaceId: workspaceId,
                    status: "Configured and Published",
                    message: "🎉 GTM tracking is now live! The ai_overview_click event will fire when users land from AI Overviews."
                };
            } catch (publishError: any) {
                console.error("Failed to publish version:", publishError.message);
                return {
                    success: true,
                    workspaceId: workspaceId,
                    status: "Configured (manual publish required)",
                    message: "Tags configured successfully! Please publish the version manually in GTM to make it live.",
                    warning: "Version created but not published. Go to GTM → Workspace → Submit to publish."
                };
            }
        } else {
            console.warn("Version created but no path returned. Check GTM UI.");
            return {
                success: true,
                workspaceId: workspaceId,
                status: "Configured (check GTM UI)",
                message: "Tags configured in workspace. Please check GTM UI to create and publish a version.",
                warning: "Version may have been created. Please check GTM UI."
            };
        }
    } catch (versionError: any) {
        console.error("Failed to create version:", versionError.message);
        console.error("Error code:", versionError.code);

        // If it's a scope error (403), provide helpful message
        if (versionError.code === 403) {
            console.log("❌ SCOPE ERROR: The OAuth token doesn't have 'tagmanager.publish' permission");
            console.log("📋 SOLUTION: Disconnect and reconnect your Google Analytics account");
            console.log("   1. Go to Analytics → Settings (gear icon)");
            console.log("   2. Delete your GA account");
            console.log("   3. Click 'Connect GA Account' again");
            console.log("   4. On Google's consent screen, accept ALL permissions including 'Publish Tag Manager containers'");
            console.log("   5. Try GTM setup again");

            return {
                success: true,
                workspaceId: workspaceId,
                status: "Configured (reconnect required)",
                message: "✅ Tags, triggers, and variables configured successfully in GTM workspace!\n\n⚠️ To enable auto-publishing: Disconnect and reconnect your GA account to grant 'Publish Tag Manager' permission.\n\nOr publish manually: Go to GTM → Workspace → Submit → Publish",
                warning: "Your current OAuth token doesn't have the 'tagmanager.publish' scope. Please reconnect your Google account."
            };
        }

        // Other errors
        return {
            success: true,
            workspaceId: workspaceId,
            status: "Configured (not published)",
            message: "Tags configured in workspace. Please create and publish a version manually in GTM.",
            warning: `Version creation failed: ${versionError.message}`
        };
    }
}