const rssParser = require("rss-converter");

const { response, api } = require("../utils/request");
const errors = require("../utils/errors");
const { diff } = require("../utils/utils");

const { addNotifications } = require("./notifications");

const App = require("../models/app");
const Channel = require("../models/channel");

async function getAccessToken(user) {
	const app = await App.findOne({ user: user._id, platform: "youtube" }).lean();

	if (!app) return errors.notFound;

	let url = `https://www.googleapis.com/oauth2/v4/token?client_id=${process.env.youtubeClientId}&client_secret=${process.env.youtubeSecret}&refresh_token=${app.refreshToken}&grant_type=refresh_token`;

	let res = await api({ method: "post", url });
	let json = res.data;

	if (res.status === 400) {
		url = `https://www.googleapis.com/oauth2/v4/token?client_id=${process.env.youtubeClientId}&client_secret=${process.env.youtubeSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${process.env.redirect}/apps/youtube`;

		res = await api({ method: "post", url });
		json = res.data;

		if (!json.refresh_token) return errors.youtubeRefreshToken;

		await App.updateOne({ user: user._id, platform: "youtube" }, { refreshToken: json.refresh_token });
	}

	return json.access_token;
}

async function getSubscriptions(event) {
	const { query, user } = event;
	const { after } = query;

	const accessToken = await getAccessToken(user);

	let url = "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=25";
	if (after) url += `&pageToken=${after}`;

	const headers = {
		Authorization: `Bearer ${accessToken}`,
	};

	const res = await api({ method: "get", url, headers });
	const json = res.data;

	const channels = json.items.map(channel => ({
		channelId: channel.snippet.resourceId.channelId,
		displayName: channel.snippet.title,
		logo: channel.snippet.thumbnails.default.url,
		after: json.nextPageToken,
	}));

	return response(200, "Youtube subscriptions found", channels);
}

async function addToWatchLater(event) {
	const { params, user } = event;
	const { id } = params;

	const accessToken = await getAccessToken(user);

	const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=${process.env.youtubeKey}`;

	const headers = {
		Authorization: `Bearer ${accessToken}`,
	};

	const body = {
		snippet: {
			playlistId: "WL",
			resourceId: {
				videoId: id,
				kind: "youtube#video",
			},
		},
	};

	const res = await api({ method: "post", url, data: body, headers });

	if (res.status === 409) return errors.duplicated;
	if (res.status === 403) return errors.youtubeForbidden;

	return response(200, "Video saved to watch later", true);
}

async function cronjob() {
	const channels = await Channel.aggregate([
		{ $match: { platform: "youtube" } },
		{
			$group: {
				_id: "$channelId",
				displayName: { $first: "$displayName" },
				users: { $push: "$user" },
			},
		},
		{ $sort: { _id: 1 } },
	]);

	let requests = [];
	for (const channel of channels) {
		const request = rssParser.toJson(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel._id}`);

		requests.push(request);
	}

	let responses = await Promise.all(requests);

	let items = [];
	for (const res of responses) {
		items = items.concat(res.items.filter(i => diff(i.published, "hours") <= 3));
	}

	requests = [];
	let remainingItems = items;
	while (remainingItems.length > 0) {
		const paginatedItems = remainingItems.slice(0, 50);
		remainingItems = remainingItems.slice(50, remainingItems.length);
		const videoIds = paginatedItems.map(i => i.yt_videoId);

		const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}&key=${process.env.youtubeKey}`;

		requests.push(api({ method: "get", url }));
	}

	responses = await Promise.all(requests);

	let videoDurationItems = [];
	for (const res of responses) {
		videoDurationItems = videoDurationItems.concat(res.data.items.slice(0, 3));
	}

	const notificationsToAdd = [];
	for (const video of items) {
		const notifications = [];
		const channel = channels.find(c => c._id === video.yt_channelId);
		const videoDurationItem = videoDurationItems.find(v => v.id === video.yt_videoId);

		if (channel) {
			for (const user of channel.users) {
				notifications.push({
					dateToSend: video.published,
					sent: true,
					notificationId: `${user}${video.yt_videoId}`,
					user,
					type: "youtube",
					info: {
						displayName: video.author.name,
						thumbnail: video.media_group.media_thumbnail_url,
						duration: videoDurationItem.contentDetails.duration,
						videoTitle: video.title,
						videoId: video.yt_videoId,
						channelId: video.yt_channelId,
					},
				});
			}
		}

		notificationsToAdd.push(addNotifications(notifications));
	}

	if (notificationsToAdd.length) await Promise.all(notificationsToAdd);

	return true;
}

module.exports = {
	getSubscriptions,
	addToWatchLater,
	cronjob,
};
