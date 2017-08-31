"use strict";

const path = require("path");
const sander = require("sander");
const yaml = require("js-yaml");
const diff = require("deep-diff").diff;
const deepfilter = require("deep-filter");
const debug = require("debug")("transifex-sync:download-translations");
const groupTargets = require("../config").groupTargets;
const api = require("../api");

async function loadTranslations(resources) {
	const loadTranslation = async (resource, code) => {
		debug(`loading ${resource.project}/${resource.slug}/${code} translation`);

		const url = `/project/${resource.project}/resource/${resource.slug}/translation/${code}?mode=onlyreviewed`;
		const response = await api.transifex().get(url);
		const doc = JSON.parse(response.data.content);

		return { resource, code, doc };
	};

	const loadResourceTranslations = async (resource) => {
		return await Promise.all(
			resource.codes.map(code => loadTranslation(resource, code))
		);
	};

	const resourcesTranslations = await Promise.all(
		resources.map(loadResourceTranslations)
	);
	const translations = [];
	for (const resourceTranslations of resourcesTranslations) {
		translations.push(...resourceTranslations);
	}
	return translations;
}

async function loadResource(targetGroup) {
	const { project, resource: slug, targets } = targetGroup;

	debug(`loading ${project}/${slug} resource`);

	const url = `/project/${project}/resource/${slug}?details`;
	const response = await api.transifex().get(url);
	const codes = response.data.available_languages
		.map(l => l.code)
		.filter(c => response.data.source_language_code !== c);

	return { project, slug, targets, codes };
}

async function loadResources(config) {
	const targetGroups = groupTargets(config);
	const resources = await Promise.all(
		targetGroups.map(loadResource)
	);
	return resources;
}

async function writeTranslations(translations) {
	const updatedFiles = [];

	const writeTargetTranslation = async (translation, target) => {
		const filename = target.translation
			.split("{code}").join(translation.code);
		const extname = path.extname(filename);
		const newDoc = deepfilter(translation.doc[target.location.key], v => v !== "");
		if (!newDoc || Object.keys(newDoc).length === 0) {
			return;
		}
		const newDocContent = (() => {
			switch (extname) {
				case ".json":
					return JSON.stringify(newDocContent, null, 2);
				case ".yaml":
				case ".yml":
					return yaml.safeDump(newDoc, { noRefs: true });
				default:
					throw new Error(`Unsupported file type ${extname}`);
			}
		})();

		const write = async () => {
			debug(`writing translation ${filename}`);
			await sander.mkdir(path.dirname(filename));
			await sander.writeFile(filename, newDocContent);
			updatedFiles.push(filename);
		};

		const exists = await sander.exists(filename);
		if (exists) {
			const oldDocContent = await sander.readFile(filename);
			const oldDoc = yaml.safeLoad(oldDocContent);
			const changes = diff(oldDoc, newDoc);

			if (changes) {
				await write();
			}
		}
		else {
			await write();
		}
	};

	const writeTranslation = async (translation) => {
		await Promise.all(
			translation.resource.targets.map(target =>
				writeTargetTranslation(translation, target)
			)
		);
	};

	await Promise.all(
		translations.map(writeTranslation)
	);

	return updatedFiles;
}

module.exports = async function (config) {
	const resources = await loadResources(config);
	const translations = await loadTranslations(resources);
	const updatedFiles = await writeTranslations(translations);

	return updatedFiles;
};
