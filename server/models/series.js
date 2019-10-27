const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SeriesSchema = new Schema({
	user: { type: Schema.ObjectId, ref: "User" },
	seriesId: { type: String, default: null },
	displayName: { type: String, default: "" },
	image: { type: String, default: "" },
});

const Series = mongoose.model("Series", SeriesSchema);

module.exports = Series;
