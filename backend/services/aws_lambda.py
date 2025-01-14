import boto3, json, os, base64


def lambda_overcast(file_path, file_name):
    # Initialize the AWS Lambda call that stores the file in s3 and scans for labels using rekognition
    lambda_client = boto3.client(
        "lambda",
        region_name=os.getenv("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )

    file_content = open(file_path, "rb").read()
    encoded_file_content = base64.b64encode(file_content).decode("utf-8")

    payload = {
        "queryStringParameters": {"filename": file_name},  
        "body": encoded_file_content,  
    }

    try:
        # Invoke the Lambda function
        response = lambda_client.invoke(
            FunctionName=os.getenv("AWS_LAMBDA_OVERCAST"),
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )
        response_payload = json.loads(response["Payload"].read())
        if response["StatusCode"] == 200:
            labels = json.loads(response_payload["body"])
            print("Detected Labels:", labels)
            return labels
        else:
            print("Error invoking Lambda:", response_payload)
            return None

    except Exception as e:
        print(f"Error: {e}")
        return None
