const axios = require("axios");

const log = require("./log");

function response(status, message, data) {
	return {
		status,
		body: {
			message,
			data,
		},
	};
}

function error(status, message, data) {
	return {
		status,
		body: {
			message,
			data,
		},
	};
}

async function api({ method, url, data, headers = {} }) {
	try {
		const res = await axios.request({ method, url, data, headers });

		return {
			status: res.status,
			data: res.data,
		};
	} catch (e) {
		log.error(e.stack);

		return {
			status: e.response ? e.response.status : 500,
			data: e.response ? e.response.data : null,
		};
	}
}

module.exports = {
	response,
	error,
	api,
};
