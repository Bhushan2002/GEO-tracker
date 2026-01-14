import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISearchConsoleAccount extends Document {
    workspaceId: mongoose.Types.ObjectId;
    siteUrl: string;
    verified: boolean;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SearchConsoleAccountSchema = new Schema<ISearchConsoleAccount>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        siteUrl: {
            type: String,
            required: false, // Site selection is optional/fetched live
        },
        verified: {
            type: Boolean,
            default: false,
        },
        accessToken: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for workspace isolation
SearchConsoleAccountSchema.index({ workspaceId: 1, isActive: 1 });

// Ensure only one active GSC account per workspace
SearchConsoleAccountSchema.index(
    { workspaceId: 1, isActive: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true }
    }
);

export const SearchConsoleAccount: Model<ISearchConsoleAccount> =
    mongoose.models.SearchConsoleAccount ||
    mongoose.model<ISearchConsoleAccount>('SearchConsoleAccount', SearchConsoleAccountSchema);
