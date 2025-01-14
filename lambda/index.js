const AWS = require('aws-sdk');
require('dotenv').config(); // Load environment variables from .env file

const s3 = new AWS.S3({ region: "eu-central-1" });
const rekognition = new AWS.Rekognition({ region: "eu-central-1" });

exports.handler = async (event) => {
    const fileName = event.queryStringParameters?.filename;
    const fileContent = event.body; // Base64 content
    const s3Bucket = process.env.S3BUCKET;
    const maxLabels = 10;
    const MAX_POLLING_ATTEMPTS = 30;

    if (!fileName || !fileContent) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "File name or content missing." }),
        };
    }

    try {
        const isImage = /\.(jpg|jpeg|png)$/i.test(fileName);
        const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(fileName);

        if (!isImage && !isVideo) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Unsupported file type. Only images and videos are supported.",
                }),
            };
        }

        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
        };
        const extension = fileName.split('.').pop().toLowerCase();
        const contentType = mimeTypes[extension] || 'application/octet-stream';

        // Upload the file to S3
        const buffer = Buffer.from(fileContent, 'base64');
        const s3Params = {
            Bucket: s3Bucket,
            Key: fileName,
            Body: buffer,
            ContentType: contentType,
        };

        await s3.putObject(s3Params).promise();
        console.log('File uploaded successfully to S3.');

        if (isImage) {
            const rekognitionParams = {
                Image: {
                    S3Object: {
                        Bucket: s3Bucket,
                        Name: fileName,
                    },
                },
                MaxLabels: maxLabels,
            };

            const rekognitionResponse = await rekognition.detectLabels(rekognitionParams).promise();
            const labelsFiltered = rekognitionResponse.Labels.map((label) => ({
                Name: label.Name,
                Confidence: label.Confidence,
            }));

            return {
                statusCode: 200,
                body: JSON.stringify({ labels: labelsFiltered }),
            };
        } else if (isVideo) {
            const startDetectionParams = {
                Video: {
                    S3Object: {
                        Bucket: s3Bucket,
                        Name: fileName,
                    },
                },
                NotificationChannel: {
                    SNSTopicArn: process.env.SNS_TOPIC_ARN,
                    RoleArn: process.env.ROLE_ARN,
                },
                MinConfidence: 50,
            };

            const startResponse = await rekognition.startLabelDetection(startDetectionParams).promise();
            const jobId = startResponse.JobId;

            // Polling for Job Status
            let attempts = 0;
            while (attempts < MAX_POLLING_ATTEMPTS) {
                const jobStatus = await rekognition.getLabelDetection({ JobId: jobId }).promise();

                if (jobStatus.JobStatus === 'SUCCEEDED') {
                    const labels = jobStatus.Labels.map((label) => ({
                        Timestamp: label.Timestamp,
                        Name: label.Label.Name,
                        Confidence: label.Label.Confidence,
                    }));

                    return {
                        statusCode: 200,
                        body: JSON.stringify({ labels }),
                    };
                }

                if (jobStatus.JobStatus === 'FAILED') {
                    throw new Error(`Job ${jobId} failed.`);
                }

                attempts++;
                await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
            }
        }
        throw new Error(`Job ${jobId} did not complete in time.`);
    } catch (err) {
        console.error('Error processing file:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
