"use strict";

const sander = require("sander");
const yaml = require("js-yaml");
const Ajv = require("ajv");
const debug = require("debug")("transifex-sync:config");

const SCHEMA_FILENAME = require.resolve("./schema.yaml");
const CONFIG_FILENAME = process.env.TRANSIFEX_SYNC_CONFIG || ".transifex-sync.yaml";

async function loadYaml(filename) {
	const content = await sander.readFile(filename);
	return yaml.safeLoad(content);
}

exports.read = async function () {
	debug(`loading ${CONFIG_FILENAME}`);

	const config = await loadYaml(CONFIG_FILENAME);
	const schema = await loadYaml(SCHEMA_FILENAME);
	const ajv = new Ajv();
	const valid = ajv.validate(schema, config);

	if (valid) {
		return config;
	}
	else {
		for (const error of ajv.errors) {
			debug(`error ${error.dataPath} ${error.message}`);
		}

		throw new Error("Invalid configuration");
	}
};

exports.groupTargets = function (config) {
	const targetGroups = [];

	for (const target of config.targets) {
		const l = target.location;
		const targetGroup = targetGroups.find(r =>
			r.project === l.project &&
			r.resource === l.resource
		);
		if (targetGroup === undefined) {
			targetGroups.push({
				project: l.project,
				resource: l.resource,
				targets: [target],
			});
		}
		else {
			targetGroup.targets.push(target);
		}
	}

	return targetGroups;
};
