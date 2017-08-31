"use strict";

const axios = require("axios");

exports.transifex = function () {
	return axios.create({
		baseURL: "https://www.transifex.com/api/2/",
		auth: {
			username: "api",
			password: process.env.TRANSIFEX_TOKEN,
		},
		headers: {
			"Content-Type": "application/json",
		},
	});
};

exports.bitbucket = function () {
	return axios.create({
		baseURL: "https://api.bitbucket.org/2.0/",
		auth: {
			username: process.env.TRANSIFEX_SYNC_BB_USER,
			password: process.env.TRANSIFEX_SYNC_BB_PASSWORD,
		},
		headers: {
			"Content-Type": "application/json",
		},
	});
};
