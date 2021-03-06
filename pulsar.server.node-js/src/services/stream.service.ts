import { channelSchema } from '../features/channel/channel.schema';
import { Comment } from '../api.models/comment';
import { SocketService, ChannelService, StreamService } from '../services';
import axios, { AxiosResponse } from 'axios';
import * as secrets from '../configs/secrets';
import { ChannelPreview, StreamServiceResponse } from '../api.models';
import * as streamRepo from '../features/stream/stream.repository';
import * as channelRepo from '../features/channel/channel.repository';
import { NotFoundError } from '../utils/errors/server.errors';
import { Types } from 'mongoose';
import { Channel } from '../features/channel/channel.model';
import { StreamSchema } from '../features/stream/stream.schema';
import { Stream } from '../features/stream/stream.model';

export async function initiateStream(streamTitle: string, userId?: string) {
    if (!userId) throw Error('UserId null');

    const channel = await ChannelService.getChannelByUserId(userId);

    const stream = new StreamSchema({
        title: streamTitle,
        id: Types.ObjectId(),
        channelId: channel.id,
    });

    channel.pending = true;
    channel.currentStream = stream;

    const result = await channelRepo.updateChannel(channel);
}

export async function addCommentToStream(channelName: string, commentData: Comment) {
    const channel = await channelSchema.findOne({ channelName: channelName });


    if (!channel?.currentStream?.startDate?.getTime()) {
        throw Error('No stream time');
    }
    const streamDuration = Date.now() - channel.currentStream.startDate.getTime();

    commentData.streamDuration = streamDuration;
    channel.currentStream.comments?.push(commentData);
    SocketService.sendComments(channelName, commentData);
    channel.save();
}

export async function getComments(channelName: string) {
    SocketService.createChatRoom(channelName);
    const channel = await channelSchema.findOne({ channelName: channelName });
    const comments = channel?.currentStream?.comments;
    comments?.sort((commentA, commentB) => (commentA.streamDuration >= commentB.streamDuration ? 1 : -1));
    return comments;
}

export async function finishStream(userId: string, save: boolean) {
    const channel = await channelRepo.getChannel({ userId: userId });

    if (channel == null) {
        throw new NotFoundError('Channel not found');
    }
    const channelName = channel?.channelName;
    channel.pending = false;
    channel.isOnline = false;

    await channelRepo.updateChannel(channel);

    if (save) {
        await saveStream(channel);
    } else {
        await deleteStream(channel);
    }

    channel.currentStream = null;
    await channelRepo.updateChannel(channel);
    SocketService.sendChannelIsOffline(channelName);
}

export async function getSavedStreams() {
    const streams = await streamRepo.getStreams();

    return streams;
}

async function saveStream(channel: Channel) {
    const result = await axios.post<StreamServiceResponse>(
        secrets.STREAM_SERVER_URL,
        {},
        {
            params: {
                channel: channel.channelName,
                streamId: channel.currentStream?.id,
            },
        }
    );

    if (result.data.status && channel.currentStream) {
        const stream = await streamRepo.createStream({ ...channel.currentStream.toObject(), channel: channel.id });
    }

    return result.data;
}

async function deleteStream(channel: Channel) {
    let result: AxiosResponse<StreamServiceResponse>;
    try {
        result = await axios.delete<StreamServiceResponse>(secrets.STREAM_SERVER_URL, {
            params: {
                channel: channel.channelName,
                streamId: channel.currentStream?.id,
            },
        });
    } catch (err) {
        console.log(err);
        throw err;
    }

    return result!.data;
}

export async function getStream(id: string) {
    let channelWithOfflineStream: any;
    const streamServer = `${secrets.STREAM_SERVER_URL}/saved/`;
    try {
        const stream = await streamRepo.getStream(id);
        if (stream == null) throw new NotFoundError(`Stream with id: ${id} not found`);
        const channel = stream.channel as Channel;

        channelWithOfflineStream = {
            isOnline: false,
            channelName: channel.channelName,
            currentStream: stream,
        };

        channelWithOfflineStream.currentStream.locationPath = `${streamServer}${channelWithOfflineStream?.currentStream?.locationPath}`;
    } catch (err) {
        console.log(err);
        throw err;
    }

    return channelWithOfflineStream;
}

export async function getOfflineStreams() {
    const savedStreams = await StreamService.getSavedStreams();
    const streamServer = `${secrets.STREAM_SERVER_URL}/saved/`;
    const streamsPreview = savedStreams.map((savedStream) => {
        return new ChannelPreview(
            (savedStream.channel as Channel).id,
            (savedStream.channel as Channel).channelName,
            savedStream.title,
            savedStream.id,
            `${streamServer}${savedStream.previewImage}`
        );
    });
    return streamsPreview;
}
