const assert = require('assert');

/* extractTranscript */

const extractEvent = {
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "us-east-1",
            "eventTime": "2021-06-05T20:49:11.598Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AWS:AROAX3TNEPDHJTLFL75DS:transcribeAudio"
            },
            "requestParameters": {
                "sourceIPAddress": "10.0.41.180"
            },
            "responseElements": {
                "x-amz-request-id": "2HBRMH2NTDZ8Z4F3",
                "x-amz-id-2": "fc3QreiL4YbR8JLeS6BqVGGrtOZQAVmN2mYastxwqfS/pYKk+pPXJBOoNLIcZAwm/hexb/5bK/7JZVupHY/Hn1Ms6jOYXnOw"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "NotifyExtractJSON",
                "bucket": {
                    "name": "transcript.results",
                    "ownerIdentity": {
                        "principalId": "AGSTP0T49PXHH"
                    },
                    "arn": "arn:aws:s3:::transcript.results"
                },
                "object": {
                    "key": "2021...06...544_tony_martignetti_nonprofit_radio_20210607.mp3.968843456.json",
                    "size": 1774175,
                    "eTag": "165d475b10cd11795d95c99027da8ffa",
                    "sequencer": "0060BBE34C245D812A"
                }
            }
        }
    ]
}

/* transcribeAudio */

const transcribeEvent = {
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "us-east-1",
            "eventTime": "2021-06-05T20:36:33.763Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AGSTP0T49PXHH"
            },
            "requestParameters": {
                "sourceIPAddress": "68.129.185.55"
            },
            "responseElements": {
                "x-amz-request-id": "KQ5VX629VT1RAQ4Q",
                "x-amz-id-2": "gHefYM7QwxafWGsJrHRd6JhaS9V/DVYREhg7ZmcDD0V//Upmo0kbfUhlkPs/S7TWozRD3CmgJtODwwTLpL9TFT85ox5Mjeoi"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "NotifyTranscribeMp3",
                "bucket": {
                    "name": "audio.mpgadv.com",
                    "ownerIdentity": {
                        "principalId": "AGSTP0T49PXHH"
                    },
                    "arn": "arn:aws:s3:::audio.mpgadv.com"
                },
                "object": {
                    "key": "2021/06/544_tony_martignetti_nonprofit_radio_20210607.mp3",
                    "size": 54237304,
                    "eTag": "d2d7c6bb95b0458c8d9913e45b8c3afb",
                    "sequencer": "0060BBE0369B015769"
                }
            }
        }
    ]
}

/* helpers */

function test(name, actual, expected) {
    const isEqual = assert.deepStrictEqual(actual, expected);
    if (isEqual) {
        console.log(`${name}: ✅ `);
    } else {
        process.exitCode = 1;
        console.log(`${name}: ❌ `);
        console.log('received %o expected %o', actual, expected);
    }
}
