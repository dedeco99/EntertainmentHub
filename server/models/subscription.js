const { Schema, model } = require("mongoose");

const SubscriptionSchema = new Schema(
	{
		user: { type: Schema.ObjectId, ref: "User", required: true },
		platform: { type: String, required: true },
		externalId: { type: String, default: "", required: true },
		displayName: { type: String, default: "", required: true },
		image: { type: String, default: "" },
		notifications: {
			active: { type: Boolean, default: true },

			// youtube
			autoAddToWatchLater: { type: Boolean, default: false },
			watchLaterPlaylist: { type: String },
			dontShowWithTheseWords: [{ type: String }],
		},
	},
	{ timestamps: { createdAt: "_created", updatedAt: "_modified" } },
);

const Subscription = model("Subscription", SubscriptionSchema);

module.exports = Subscription;
