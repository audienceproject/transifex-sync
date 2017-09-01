#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

"use strict";

if (process.env.hasOwnProperty("DEBUG") === false) {
	process.env.DEBUG = "transifex-sync:*";
}

const lib = require("../lib");

async function executeCommand(config, cmd) {
	switch (cmd) {
		case "upload-sources":
			await lib.uploadSources(config);
			break;
		case "download-translations":
			await lib.downloadTranslations(config);
			break;
		default:
			throw new Error(`Unknown command ${cmd}`);
	}
}

async function handleBitbucketBranch(config) {
	const dirtyFiles = [];
	await lib.checkBranchHead();
	await lib.uploadSources(config);
	const updatedTranslations = await lib.downloadTranslations(config);
	dirtyFiles.push(...updatedTranslations);
	await lib.commit(dirtyFiles);
}

async function run() {
	const cmd = process.argv[2];
	const config = await lib.readConfig();

	if (cmd) {
		await executeCommand(config, cmd);
	}
	else if (process.env.BITBUCKET_COMMIT) {
		await handleBitbucketBranch(config);
	}
	else {
		throw new Error("Usage 'transifex-sync <upload-sources|download-translations>'");
	}
}

function handleError(err) {
	if (err.response) {
		console.error(`${err.response.status} ${err.response.statusText} ${err.request.url}`);
		if (err.response.data) {
			const data = err.response.data;
			const output = typeof data === "string" ? data : JSON.stringify(data, null, 2);
			console.error(output);
		}
	}

	console.error(err.stack);
	process.exitCode = 1;
}

run().catch(handleError);
