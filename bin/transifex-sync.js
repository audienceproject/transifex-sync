#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

"use strict";

if (process.env.hasOwnProperty("DEBUG") === false) {
	process.env.DEBUG = "transifex-sync:*";
}

const lib = require("../lib");

async function run() {
	const cmds = process.argv.slice(2);
	const executed = [];

	const dirtyFiles = [];
	const config = await lib.readConfig();

	for (const cmd of cmds) {
		if (executed.includes(cmd)) {
			throw new Error(`Command ${cmd} already executed`);
		}

		switch (cmd) {
			case "upload-sources": {
				await lib.cmd.uploadSources(config);
				break;
			}
			case "download-translations": {
				const updatedTranslations = await lib.cmd.downloadTranslations(config);
				dirtyFiles.push(...updatedTranslations);
				break;
			}
			case "commit-bitbucket": {
				await lib.cmd.commitBitbucket(dirtyFiles);
				break;
			}
			default:
				throw new Error(`Unknown command ${cmd}`);
		}

		executed.push(cmd);
	}
}

function handleError(err) {
	if (err.response && err.response.data) {
		const data = err.response.data;
		const output = typeof data === "string" ? data : JSON.stringify(data, null, 2);
		console.error(output);
	}

	console.error(err.stack);
	process.exitCode = 1;
}

run().catch(handleError);
