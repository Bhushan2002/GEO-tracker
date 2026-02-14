import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

export async function GET(request : NextRequest){
    try{
        const {searchParams} = new URL(request.url);
        const accountId = searchParams.get('accountId');

        if (!accountId){
            return NextResponse.json({error: "Missing accountId parameter"}, {status: 400});
        }
        await connectDatabase();

        const workspaceId = await getWorkspaceId(request);
        if (!workspaceId){
            return workspaceError();
        }

        const account = await GAAccount.findOne({ _id: accountId , workspaceId: workspaceId });
        if (!account){
            return NextResponse.json({error: "GA Account not found"}, {status: 404});
        }
        // Use centralized token refresh utility
    const accessToken = await refreshTokenIfNeeded(account);

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GA_CLIENT_ID,
      process.env.GA_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({
      version: "v1beta",
      auth: oauth2Client,
    });
    const response = await analyticsData.properties.runRealtimeReport({
        property: `properties/${account.propertyId}`,
        requestBody:{
            dimensions:[
                {name  : 'minutesAgo'}
            ],
            metrics: [{name: 'eventCount'}],
            dimensionFilter:{
                filter :{
                    fieldName: "eventName",
                    stringFilter :{
                        matchType: "EXACT",
                        value: "ai_overview_click",
                        caseSensitive: false
                    }
                }
            }
        }
    });
    
    console.log("Realtime API Response:", JSON.stringify(response.data, null, 2));
    console.log("Rows count:", response.data.rows?.length || 0);
    
    const minuteMap = new Map<number, number>();
    response.data.rows?.forEach((row: any)=>{
        const minuteAgo = parseInt(row.dimensionValues[0]?.value ||'0');
        const eventCount = parseInt(row.metricValues[0]?.value || '0');
        console.log(`Minute ${minuteAgo}: ${eventCount} events`);
        minuteMap.set(minuteAgo, eventCount);
    });

    const timeline  = [];
    let totalActive = 0;

    // Get all minutes that have data
    const allMinutes = Array.from(minuteMap.keys()).sort((a, b) => b - a);
    const maxMinute = allMinutes.length > 0 ? Math.max(...allMinutes) : 30;
    
    // Build timeline for last 30 minutes (or up to max minute with data)
    for (let i = Math.min(30, maxMinute) ; i >= 0; i--){
        const count = minuteMap.get(i) || 0;
        timeline.push({minute: i, count: count});
        totalActive += count;
    }

    console.log("Timeline:", timeline);
    console.log("Total active users:", totalActive);

    return NextResponse.json({timeline: timeline, activeUsers: totalActive});
    }catch(err: any){
        console.error("Error fetching real-time AI overview data:", err);
        return NextResponse.json({error: err.message}, {status: 500});
    }
}