from fastapi import FastAPI
from dotenv import load_dotenv
import uvicorn
import os
import logging
from api import media
from fastapi.middleware.cors import CORSMiddleware
from db import db
import os


logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.DEBUG)

app = FastAPI()
app.include_router(media.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],  
)


load_dotenv()
customPort = "8080"
try:
    customPort = int(os.getenv("PORT"))
except ValueError:
    print("couldn't get the port from .env")

if __name__ == "__main__":
    uploads_dir = os.getenv("UPLOADS_DIR")
    db.create_hashes_database()
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    uvicorn.run(app, host=os.getenv("HOST"), port=customPort)
