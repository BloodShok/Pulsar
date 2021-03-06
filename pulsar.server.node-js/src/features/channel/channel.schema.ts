import { Schema, model } from 'mongoose';
import { Channel } from './channel.model';
import { streamSchemaDef } from '../stream/stream.schema';

const channelSchemaDef = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user-accounts',
            required: true,
        },
        channelName: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: false,
        },

        streamToken: {
            type: String,
            required: true,
            unique: true,
        },

        currentStream: streamSchemaDef,

        savedStreams: {
            type: Schema.Types.ObjectId,
            ref: 'stream',
        },

        isOnline: {
            type: Boolean,
            default: false,
        },
        pending: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

channelSchemaDef.set('toObject', { getters: true });

export const channelSchema = model<Channel>('channel', channelSchemaDef);
