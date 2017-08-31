"use strict";

const fs = require("fs");
const concatStream = require("concat-stream");
const FormData = require("form-data");
const api = require("../api");

module.exports = async function (dirtyFiles) {
	if (dirtyFiles.length === 0) {
		return;
	}

	const username = process.env.BITBUCKET_REPO_OWNER;
	const slug = process.env.BITBUCKET_REPO_SLUG;
	const commit = process.env.BITBUCKET_COMMIT;
	const branch = process.env.BITBUCKET_BRANCH;

	const url = `/repositories/${username}/${slug}/src`;
	const params = {
		message: "Updating translations",
		parents: commit,
		branch,
	};

	const fd = new FormData();
	const sent = new Promise((resolve, reject) => {
		fd
			.on("error", reject)
			.pipe(concatStream(data => {
				api.bitbucket().post(url, data, {
					headers: fd.getHeaders(),
					params,
				}).then(resolve, reject);
			}))
			.on("error", reject);
	});

	for (const filename of dirtyFiles) {
		fd.append(filename, fs.createReadStream(filename));
	}

	await sent;
};
