import os


def save_file(file_content, file_name):
    uploads_dir = os.getenv("UPLOADS_DIR")
    local_file_path = os.path.join(uploads_dir, file_name)

    with open(local_file_path, "wb") as f:
        f.write(file_content)
    return local_file_path
