import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { setupGtmTracking } from "@/lib/services/gtm-service";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
    try {
        await connectDatabase();
        const body = await req.json();
        const { dbAccountId, gtmAccountId, gtmContainerId } = body;

        const gaAccount = await GAAccount.findById(dbAccountId);
        if (!gaAccount) return NextResponse.json({ error: "Account not found" }, { status: 404 });
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: gaAccount.accessToken,
            refresh_token: gaAccount.refreshToken,
        });

        const adminClient = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
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


        const result = await setupGtmTracking(
            gaAccount.accessToken,
            gaAccount.refreshToken,
            gtmAccountId,
            gtmContainerId,
            realMeasurementId
        );

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}