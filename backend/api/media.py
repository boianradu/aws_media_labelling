from fastapi import File, UploadFile, APIRouter, HTTPException
import logging
from dotenv import load_dotenv
from utils import utils, crypto
from services import aws_lambda
import json
from db import db

logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.DEBUG)
load_dotenv()

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

router = APIRouter(
    prefix="/api",
    tags=["api", "upload", "media"],
    responses={404: {"description": "Not found"}},
)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Check file size
    if file.size > MAX_FILE_SIZE:
        return {
            "message": f"File size exceeds the limit of 15 MB. Your file size: {file.size / (1024 * 1024):.2f} MB",
            "status": 413,
        }
    local_value = db.get_hash_by_filename(filename=file.filename)
    if local_value:
        data = json.loads(local_value)

        # Check if "labels" exists and is not empty
        if "labels" not in data or not data["labels"]:
            raise HTTPException(
                status_code=500, detail="No labels found in the database entry."
            )
        labels_str = data["labels"]
        labels_dict = json.loads(labels_str.replace("'", '"'))
        labels_dict = {"labels": labels_dict}
        if isinstance(labels_dict, dict):
            labels_list = labels_dict.get("labels", [])
        else:
            print("Expected a dictionary for labels_dict", labels_dict)
            return {
                "message": "Error labels",
                "status": 500,
            }

        return {
            "message": "File details received from local db",
            "labels": labels_list,
            "status": 202,
        }
    content = await file.read()
    file_location = utils.save_file(content, file.filename)
    labels = aws_lambda.lambda_overcast(
        file_location, file.filename
    )  # call the lambda function in aws
    if labels is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to process the file. AWS Lambda returned no labels.",
        )
    print("Labels:", labels)
    db.store_file_hash_in_db(
        file.filename, labels.get("labels"), crypto.calculate_file_hash(file_location)
    )

    return {
        "filename": file.filename,
        "file_size": len(content),
        "file_mime_type": file.content_type,
        "labels": labels.get("labels"),
        "status": 200,
    }
