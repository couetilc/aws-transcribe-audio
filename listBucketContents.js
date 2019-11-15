'use strict';
const fs = require('fs');
const util = require('util');

const AWS = require('aws-sdk');
const S3 = new AWS.S3({apiVersion: '2006-03-01'});

const AUDIO_FILE_TYPES = ['mp3', 'wav', 'flac'];
const CONFIG_FILENAME = 'config.json';
const AUDIO_LIST_FILENAME = 'audio-file-list.txt';

const readFile = util.promisify(fs.readFile);

readFile(CONFIG_FILENAME, {encoding: 'utf-8', flag: 'r'})
	.then(config_file => JSON.parse(config_file))
	.then(config => listBucketContents(
		config.S3_BUCKET_NAME,
		config.S3_BUCKET_PREFIXES
	))
	.catch(error => console.log(error));

function listBucketContents(bucket, prefixes = ['']) {
	const reducer2dArray = (accumulator, item) => accumulator.concat(item);

	return Promise
		.all(prefixes.map(prefix => listAudioFiles(bucket, prefix)))
		.then(list_of_lists => list_of_lists.reduce(reducer2dArray))
		.then(audio_files => {
			fs.writeFileSync(AUDIO_LIST_FILENAME, JSON.stringify(audio_files, null, 4));
		});
}

function listAudioFiles(bucket, prefix) {
	const param_LOV2 = {
		Bucket: bucket,
		Prefix: prefix
	};

	return S3.listObjectsV2(param_LOV2).promise().then(response => {
		const filenames = response.Contents.map(object => object.Key);
		const audio_filenames = filenames.filter(isAudioFile);
		return audio_filenames;
	});
}

function isAudioFile(filename) {
	const extension = filename.split('.').pop();
	return AUDIO_FILE_TYPES.includes(extension);
}
