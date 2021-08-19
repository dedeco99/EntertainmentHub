import React, { useContext } from "react";
import PropTypes from "prop-types";

import { makeStyles, Typography, Link, ListItem, Box } from "@material-ui/core";

import { VideoPlayerContext } from "../../contexts/VideoPlayerContext";

import { formatDate, diff, formatVideoDuration } from "../../utils/utils";

import placeholder from "../../img/noimage.png";

import { feed as feedStyles } from "../../styles/Youtube";
import { videoPlayer as videoPlayerStyles } from "../../styles/VideoPlayer";

const useStyles = makeStyles({ ...feedStyles, ...videoPlayerStyles });

function Video({ platform, video }) {
	const classes = useStyles();
	const videoPlayer = useContext(VideoPlayerContext);

	function handleAddToVideoPlayer() {
		videoPlayer.dispatch({
			type: "ADD_VIDEO",
			videoSource: platform,
			video: {
				name: video.videoTitle,
				thumbnail: video.thumbnail,
				// https://www.twitch.tv/videos/1088547163
				url:
					platform === "youtube"
						? `https://www.youtube.com/watch?v=${video.videoId}`
						: `https://clips.twitch.tv/embed?clip=${video.videoId}&parent=${window.location.hostname}`,
				channelName: video.displayName,
				channelUrl:
					platform === "youtube"
						? `https://www.youtube.com/channel/${video.channelId}`
						: `https://www.twitch.com/${video.displayName}`,
			},
		});
	}

	function renderVideo() {
		return (
			<ListItem key={video.videoId} divider style={{ padding: 0, margin: 0 }}>
				<Box display="flex" flexDirection="column" flex="auto" minWidth={0}>
					<Box position="relative" className={classes.videoThumbnail}>
						<img src={video.thumbnail ? video.thumbnail : placeholder} width="100%" alt="Video thumbnail" />
						<Box position="absolute" bottom="0" right="0" px={0.5} style={{ backgroundColor: "#212121DD" }}>
							<Typography variant="caption">{formatVideoDuration(video.duration, platform)}</Typography>
						</Box>
						<Box
							className={classes.videoPlayOverlay}
							display="flex"
							alignItems="center"
							justifyContent="center"
							onClick={handleAddToVideoPlayer}
						>
							<i className="icon-play icon-2x" />
						</Box>
					</Box>
					<Box style={{ paddingLeft: 5, paddingRight: 10, height: 108 }}>
						<Typography className={classes.videoTitle} variant="body1" title={video.videoTitle}>
							<Link
								href={
									platform === "youtube"
										? `https://www.youtube.com/watch?v=${video.videoId}`
										: `https://clips.twitch.tv/${video.videoId}`
								}
								target="_blank"
								rel="noreferrer"
								color="inherit"
							>
								{video.videoTitle}
							</Link>
						</Typography>
						<Typography variant="body2" title={video.displayName}>
							<Link
								href={
									platform === "youtube"
										? `https://www.youtube.com/channel/${video.channelId}`
										: `https://www.twitch.com/${video.displayName}`
								}
								target="_blank"
								rel="noreferrer"
								color="inherit"
							>
								{video.displayName}
							</Link>
						</Typography>
						<Typography variant="caption">
							{video.scheduled && diff(video.scheduled, "minutes") <= 0 ? (
								<b>{`Scheduled for ${formatDate(video.scheduled, "DD-MM-YYYY HH:mm")}`}</b>
							) : (
								`${formatDate(video.published, "DD-MM-YYYY HH:mm", true)} • ${video.views} views`
							)}
						</Typography>
						{video.likes && video.dislikes && (
							<Box display="flex" flexDirection="row" flex="1 1 auto" minWidth={0}>
								<Typography variant="caption" style={{ paddingRight: "10px" }}>
									<i className="icon-thumbs-up" />
									{` ${video.likes}`}
								</Typography>
								<Typography variant="caption">
									<i className="icon-thumbs-down" />
									{` ${video.dislikes}`}
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			</ListItem>
		);
	}

	return renderVideo();
}

Video.propTypes = {
	platform: PropTypes.string.isRequired,
	video: PropTypes.object.isRequired,
};

export default Video;
