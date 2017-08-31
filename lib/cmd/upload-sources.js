"use strict";

const sander = require("sander");
const yaml = require("js-yaml");
const diff = require("deep-diff").diff;
const titleCase = require("title-case");
const debug = require("debug")("transifex:upload-sources");
const groupTargets = require("../config").groupTargets;
const api = require("../api");

async function readSource(target) {
	debug(`reading source ${target.source}`);

	const content = await sander.readFile(target.source);
	const doc = yaml.safeLoad(content);

	return { target, doc };
}

async function readSources(config) {
	const sources = await Promise.all(
		config.targets.map(readSource)
	);
	return sources;
}

async function loadResource(targetGroup) {
	const { project, resource: slug, targets } = targetGroup;

	debug(`loading ${project}/${slug} resource`);

	const url = `/project/${project}/resource/${slug}`;
	const response = await api.transifex().get(url, { validateStatus: s => s < 500 });
	const exists = response.status === 200;
	const resource = { exists, project, slug, targets, doc: { }};

	if (exists) {
		if (response.data["i18n_type"] !== "KEYVALUEJSON") {
			throw new Error(`${url} is not JSON`);
		}
		const contentResponse = await api.transifex().get(`${url}/content`);
		resource.doc = JSON.parse(contentResponse.data.content);
	}

	return resource;
}

async function loadResources(config) {
	const targetGroups = groupTargets(config);
	const resources = await Promise.all(
		targetGroups.map(loadResource)
	);
	return resources;
}

function prepareResourceUpdates(resources, sources) {
	const updatedResources = [];

	for (const resource of resources) {
		const oldDoc = resource.doc;
		const newDoc = JSON.parse(JSON.stringify(oldDoc));
		const resourceSources = sources
			.filter(s => resource.targets.includes(s.target));

		for (const source of resourceSources) {
			newDoc[source.target.location.key] = source.doc;
		}

		const docChanges = diff(oldDoc, newDoc);
		if (docChanges) {
			updatedResources.push({
				exists: resource.exists,
				project: resource.project,
				slug: resource.slug,
				doc: newDoc,
				docChanges,
			});
		}
	}

	return updatedResources;
}

function logResourceUpdates(resources) {
	for (const r of resources) {
		// eslint-disable-next-line
		console.log(`${r.project}/${r.slug} changes: ${r.docChanges.length}`);
	}
}

async function updateResources(resourceUpdates) {
	const updateResource = async (resource) => {
		const content = JSON.stringify(resource.doc);
		const id = `${resource.project}/${resource.slug}`;

		if (resource.exists) {
			const url = `/project/${resource.project}/resource/${resource.slug}/content`;
			debug(`updating '${id}'`);
			await api.transifex().put(url, { content });
		}
		else {
			const url = `/project/${resource.project}/resources`;
			debug(`creating '${id}'`);
			await api.transifex().post(url, {
				name: titleCase(resource.slug),
				slug: resource.slug,
				"i18n_type": "KEYVALUEJSON",
				content,
			});
		}
	};

	await Promise.all(resourceUpdates.map(updateResource));
}

module.exports = async function (config) {
	const [sources, resources] = await Promise.all(
		[readSources(config), loadResources(config)]
	);
	const updatedResources = await prepareResourceUpdates(resources, sources);
	logResourceUpdates(updatedResources);
	await updateResources(updatedResources);
};
