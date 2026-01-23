import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

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
        // Refresh Token Logic
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GA_CLIENT_ID,
      process.env.GA_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

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
    const minuteMap = new Map<number, number>();
    response.data.rows?.forEach((row: any)=>{
        const minuteAgo = parseInt(row.dimensionValues[0]?.value ||'0');
        const eventCount = parseInt(row.metricValues[0]?.value || '0');

        minuteMap.set(minuteAgo, eventCount);
    });

    const timeline  = [];
    let totalActive = 0;

    for (let i =4 ; i>=0;i--){
        const count = minuteMap.get(i) || 0;
        timeline.push({minute: i, count: count});
        totalActive += count;
    }

    return NextResponse.json({timeline: timeline, totalActiveUsers: totalActive});
    }catch(err: any){
        console.error("Error fetching real-time AI overview data:", err);
        return NextResponse.json({error: err.message}, {status: 500});
    }
}