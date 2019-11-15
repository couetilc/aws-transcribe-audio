'use strict';
const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');

const AWS = require('aws-sdk');

const S3 = new AWS.S3({apiVersion: '2015-03-31'});
const Lambda = new AWS.Lambda({apiVersion: '2015-03-21'});
const Scribe = new AWS.TranscribeService({apiVersion: '2017-10-26'});

const DEFAULT_LIMIT = 10;
const AUDIO_FILE_TYPES = ['mp3', 'wav', 'flac'];
const CONFIG_FILENAME = 'config.test.json';

const readFile = util.promisify(fs.readFile);
const delay = util.promisify(setTimeout);

let config = null;

class JobList extends EventEmitter {
	constructor(bucket, prefixes = [''], job_limit = DEFAULT_LIMIT) {
		if (!bucket) {
			throw new TypeError('Job List initialized without specifying S3 bucket');
		}

		super();
		this.bucket =  bucket;
		this.prefixes = prefixes;
		this.job_limit = job_limit;
		this.job_list = [];
	}

	initialize() {
		const reducer2dArray = (accumulator, item) => accumulator.concat(item);
		return Promise
			.all(this.prefixes.map(prefix => listAudioFiles(this.bucket, prefix)))
			.then(list_of_lists => list_of_lists.reduce(reducer2dArray))
			.then(audio_files => audio_files.map(filename => ({
				filename: filename,
				jobname: null,
				status: "PENDING
			})))
			.then(job_list => {
			});
	}
}

readFile(CONFIG_FILENAME, {encoding: 'utf-8', flag: 'r'})
	.then(data => {
		config = JSON.parse(data);
		return initializeJobList(
			config.S3_BUCKET_NAME,
			config.S3_BUCKET_PREFIXES,
			config.TRANSCRIBE_JOB_LIMIT
		);
	})
