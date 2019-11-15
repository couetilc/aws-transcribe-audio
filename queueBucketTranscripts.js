'use strict';
const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');

const AWS = require('aws-sdk');
if (!AWS.config.region) {
	AWS.config.update({
		region: 'us-east-1'
	});
}
const S3 = new AWS.S3({apiVersion: '2006-03-01'});
const Lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const Scribe = new AWS.TranscribeService({apiVersion: '2017-10-26'});

const DEFAULT_JOB_LIMIT = 10;
const AUDIO_FILE_TYPES = ["mp3", "wav", "flac"];
const CONFIG_FILENAME = 'config.json';

const readFile = util.promisify(fs.readFile);
const delay = util.promisify(setTimeout);

readFile(CONFIG_FILENAME, {encoding: 'utf-8', flag: 'r'})
	.then(config_file => JSON.parse(config_file))
	.then(config => this.config = config)
	.then(config => initializeJobList(
		config.S3_BUCKET_NAME, 
		config.S3_BUCKET_PREFIXES
	))
	.then(job_list => pollTranscriptionService(
		job_list, 
		this.config.TRANSCRIBE_JOB_LIMIT
	))
	.catch(error => { 
		console.log(error);
	});

async function pollTranscriptionService(job_list, job_limit = DEFAULT_JOB_LIMIT) {
	const isJobPending = job => job.status === 'PENDING';
	const reducerCountPending = (count, job) => (job.status === 'PENDING' 
		? count + 1
		: count);
	const reducerCountSubmitted = (count, job) => (job.status === 'SUBMITTED' 
		? count + 1
		: count);
	let num_jobs_left = job_list.reduce(reducerCountPending, 0);

	while (num_jobs_left > 0) {
		let in_progress_count = await countJobsInProgress();
		console.log('# jobs in progress: ', in_progress_count);
		if (in_progress_count < job_limit) {
			//start the next transcription, set status to SUBMITTED
			const next_job = job_list.find(isJobPending);

			const transcribe_event = {
				Records: [{
					s3: {
						object: { key: next_job.key },
						bucket: { name: next_job.bucket }
					}
				}]
			};
			const transcribe_param = {
				FunctionName: 'transcribeAudio',
				InvocationType: 'Event',
				Payload: JSON.stringify(transcribe_event)
			};

			await Lambda.invoke(transcribe_param).promise()
				.then(response => {
					if (response.code && response.code === 'ThrottlingException') {
						return delay(1000);
					} else {
						next_job.status = 'SUBMITTED';
					}
				})
				.catch(error => {
					throw new Error(JSON.stringify(error));
				});
		} else {
			//DELAY FOR A PERIOD OF TIME
			await delay(60000);
		}
		num_jobs_left = job_list.reduce(reducerCountPending, 0);
		const num_jobs_submitted = job_list.reduce(reducerCountSubmitted, 0);
		console.log('# pending jobs: ', num_jobs_left);
		console.log('# submitted jobs: ', num_jobs_submitted);
	}
}

async function countJobsInProgress() {
	let num_inprogress = 0;
	let param_LTJ = {
		Status: 'IN_PROGRESS'
	};

	do {
		await Scribe.listTranscriptionJobs(param_LTJ).promise()
			.then(response => {
				param_LTJ.NextToken = response.NextToken;
				num_inprogress += response.TranscriptionJobSummaries.length;
			})
			.catch(error => {
				if (error.code === 'ThrottlingException') {
					return delay(1000);
				} else {
					throw new Error(JSON.stringify(error));
				}
			});
	} while (param_LTJ.NextToken);

	return num_inprogress;
}

function initializeJobList(bucket, prefixes = ['']) { 
	if (!bucket) throw new TypeError('Must specify target S3 bucket for function initializeJobList'); 
	const reducer2dArray = (accumulator, item) => accumulator.concat(item);

	//listJobObjectKeys
	return Promise
		.all(prefixes.map(prefix => listAudioFiles(bucket, prefix)))
		.then(list_of_lists => list_of_lists.reduce(reducer2dArray))
		.then(audio_files => audio_files.map(filename => ({
			bucket: bucket,
			key: filename,
			jobname: null,
			status: "PENDING"
		})));
}

function listAudioFiles(bucket, prefix) {
	const param_LOV2 = {
		"Bucket": bucket,
		"Prefix": prefix
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
