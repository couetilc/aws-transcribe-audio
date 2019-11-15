const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const lambda = new aws.Lambda({apiVersion: '2015-03-31'});

const tmnpr_prefixes = ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "TMNPR Episodes"];

exports.transcribe = async event => {
	console.log(JSON.stringify(event));
	const audio_bucket = process.env.AUDIO_SOURCE_S3BUCKET_NAME;
	return transcribeObjects(audio_bucket, tmnpr_prefixes);
}

function transcribeObjects(bucket, prefixes = [""]) {
	return Promise.all(prefixes.map(prefix => {
		const list_param = {
			"Bucket": bucket,
			"Prefix": prefix
		};

		return s3.listObjectsV2(list_param).promise()
			.then(data => {
				return data.Contents.filter(item => {
					const extension = item.Key.split('.').pop();
					return ["mp3", "wav", "flac"].includes(extension);
				});
			})
			.then(audio_files => {
				return Promise.all(audio_files.map(file => {
					const event = {
						Records: [{
							s3: { 
								object: { key: file.Key },
								bucket: { name: bucket }
							}
						}]
					};

					const transcribe_param = {
						FunctionName: "transcribeAudio",
						InvocationType: "Event",
						Payload: JSON.stringify(event)
					};

					return lambda.invoke(transcribe_param).promise();
				}));
			})
			.catch(error => {
				console.log(error, error.stack);
				return [];
			});
	}));
}
