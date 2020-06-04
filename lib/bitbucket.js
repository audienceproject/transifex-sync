"use strict";

const fs = require("fs");
const concatStream = require("concat-stream");
const FormData = require("form-data");
const debug = require("debug")("transifex-sync:bitbucket");
const api = require("./api");

const USERNAME = process.env.BITBUCKET_REPO_OWNER;
const REPO = process.env.BITBUCKET_REPO_SLUG;
const COMMIT = process.env.BITBUCKET_COMMIT;
const BRANCH = process.env.TRANSIFEX_SYNC_BB_BRANCH || "translation";

exports.checkBranchHead = async function () {
	const bb = api.bitbucket();
	let url = `/repositories/${USERNAME}/${REPO}/refs/branches`;
	do {
		// eslint-disable-next-line no-await-in-loop
		debug('getting branches from bitbucket');
		const response = await bb.get(url);
		url = response.data.next || null;

		const branches = response.data.values;
		for (const branch of branches) {
			if (branch.name === BRANCH) {
				if (branch.target.hash === COMMIT) {
					debug(`is branch '${BRANCH}' head`);
					return;
				}
				else {
					throw new Error(`Not branch '${BRANCH}' head`);
				}
			}
		}
	}
	while (url !== null);

	throw new Error(`Branch '${BRANCH}' not found`);
};

exports.commit = async function (files) {
	if (files.length === 0) {
		debug("nothing to commit");
		return;
	}

	debug(`${files.length} to commit`);

	const form = new FormData();
	form.append("message", "Updating translations");
	form.append("parents", COMMIT);
	form.append("branch", BRANCH);

	for (let i = 0; i < files.length; i++) {
		const filename = files[i];
		debug(`adding ${filename}`);
		form.append(filename, fs.createReadStream(filename), { filename });
	}

	await new Promise((resolve, reject) => {
		form.pipe(concatStream(async data => {
			try {
				const url = `/repositories/${USERNAME}/${REPO}/src`;
				debug(`commiting to ${USERNAME}/${REPO}/${BRANCH} at ${COMMIT}`);
				await api.bitbucket().post(url, data, { headers: form.getHeaders() });
				resolve();
			}
			catch (err) {
				reject(err);
			}
		})).on("error", reject);
	});
};
