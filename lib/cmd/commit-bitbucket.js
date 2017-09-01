"use strict";

const fs = require("fs");
const concatStream = require("concat-stream");
const FormData = require("form-data");
const debug = require("debug")("transifex-sync:commit-bitbucket");
const api = require("../api");

module.exports = async function (dirtyFiles) {
	if (dirtyFiles.length === 0) {
		debug("nothing to commit");
		return;
	}
	debug(`${dirtyFiles.length} to commit`);

	const username = process.env.BITBUCKET_REPO_OWNER;
	const slug = process.env.BITBUCKET_REPO_SLUG;
	const commit = process.env.BITBUCKET_COMMIT;
	const branch = process.env.BITBUCKET_BRANCH;

	debug(`commiting to ${username}/${slug} at ${branch}:${commit}`);

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
				}).then(resolve, (err) => {
					debug("commit error");
					if (err && err.response && err.response.data) {
						const dataStr = JSON.stringify(err.response.data);
						debug(dataStr);
					}
					throw err;
				});
			}))
			.on("error", reject);
	});

	for (const filename of dirtyFiles) {
		debug(`adding ${filename}`);
		fd.append(filename, fs.createReadStream(filename));
	}

	await sent;
};
