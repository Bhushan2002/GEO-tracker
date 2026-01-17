import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { setupGtmTracking } from "@/lib/services/gtm-service";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
    try {
        await connectDatabase();
        const body = await req.json();


        const {dbAccountId} = body

        // const { dbAccountId, gtmAccountId, gtmContainerId } = body;

        const gaAccount = await GAAccount.findById(dbAccountId);


        if (!gaAccount) return NextResponse.json({ error: "Account not found" }, { status: 404 });

        // Initialize OAuth2 client with credentials
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GA_CLIENT_ID,
            process.env.GA_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
            access_token: gaAccount.accessToken,
            refresh_token: gaAccount.refreshToken,
        });

        const adminClient = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });
        const propertyPath = gaAccount.propertyId.includes('properties/')
            ? gaAccount.propertyId
            : `properties/${gaAccount.propertyId}`;

        const streamsResponse = await adminClient.properties.dataStreams.list({
            parent: propertyPath,
        });

        const streams = streamsResponse.data.dataStreams || [];

        // Find the first Web Data Stream
        const webStream = streams.find(s => s.type === 'WEB_DATA_STREAM');

        if (!webStream || !webStream.webStreamData?.measurementId) {
            return NextResponse.json({
                error: "No Web Data Stream found. Please create a Data Stream in GA4 first."
            }, { status: 400 });
        }
        const realMeasurementId = webStream.webStreamData.measurementId;

        console.log(`Found Measurement ID: ${realMeasurementId}`);


        // const result = await setupGtmTracking(
        //     gaAccount.accessToken,
        //     gaAccount.refreshToken,
        //     gtmAccountId,
        //     gtmContainerId,
        //     realMeasurementId
        // );
        try{
            const eventRulesResource = (adminClient.properties.dataStreams as any).eventCreateRules as any;
            await eventRulesResource.create({
                parent: webStream.name,
                requestBody:{
                    destinationEvent: 'ai_overview_click',
                    eventConditions:[
                        {
                            field: "event_name",
                            comparisonType: "EQUALS",
                            value: "page_view"
                        },
                        {
                            field: "page_location",
                            comparisonType: "CONTAINS",
                            value: ":~:text="
                        },
                    ],
                    sourceCopyParameters: true,
                }
            });
            console.log("GA4 event creation rule created successfully.");

        }catch(e: any){
            if (e.code === 409 || e.message?.includes('already exists')) {
                console.log("Rule already exists, skipping creation.");
                return NextResponse.json({ 
                    success: true, 
                    status: "Rule Already Exists (No Action Needed)", 
                    streamId: webStream.name 
                });
            }
            // Real error? Throw it.
            throw e;
        }

        return NextResponse.json({
            success: true,
            status: "Success: Tracking configuration via GA4 Admin API",
            streamId: webStream.name
        });
    } catch (error: any) {
        console.error("GTM Setup Error:", error.message);
        console.error("Full error:", error);
        console.error("Error response:", error.response?.data);
        return NextResponse.json({
            error: error.message || "GTM setup failed",
            details: error.response?.data?.error || error.toString()
        }, { status: 500 });
    }
}