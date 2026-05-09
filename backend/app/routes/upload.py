from fastapi import APIRouter, UploadFile, File
import os
import shutil
import zipfile

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
EXTRACT_FOLDER = os.path.join(BASE_DIR, "extracted_projects")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXTRACT_FOLDER, exist_ok=True)


@router.get("/")
def upload_home():
    return {"message": "Upload route working"}


# 🔥 CLEAR OLD DATA (keep only latest upload)
def clear_folder(folder_path: str):
    if not os.path.exists(folder_path):
        return

    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)


# 🔥 FIX ZIP STRUCTURE
def flatten_nested_folder(extract_path: str):
    while True:
        extracted_items = os.listdir(extract_path)

        if len(extracted_items) != 1:
            break

        inner_path = os.path.join(extract_path, extracted_items[0])

        if not os.path.isdir(inner_path):
            break

        inner_items = os.listdir(inner_path)

        for item in inner_items:
            shutil.move(os.path.join(inner_path, item), extract_path)

        os.rmdir(inner_path)


# ✅ SINGLE FILE UPLOAD (FIXED)
@router.post("/file")
def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        return {"error": "No file selected"}

    # clear old data
    clear_folder(UPLOAD_FOLDER)
    clear_folder(EXTRACT_FOLDER)

    # create project for single file
    project_name = "single_file_project"
    project_path = os.path.join(EXTRACT_FOLDER, project_name)
    os.makedirs(project_path, exist_ok=True)

    # save file inside project
    file_path = os.path.join(project_path, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "message": "File uploaded successfully",
        "project_name": project_name,
        "filename": file.filename,
        "saved_path": file_path
    }


# ✅ ZIP UPLOAD
@router.post("/zip")
def upload_zip(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        return {"error": "Only ZIP files are allowed"}

    # keep only latest upload
    clear_folder(UPLOAD_FOLDER)
    clear_folder(EXTRACT_FOLDER)

    zip_path = os.path.join(UPLOAD_FOLDER, file.filename)
    project_name = file.filename.replace(".zip", "")
    extract_path = os.path.join(EXTRACT_FOLDER, project_name)

    os.makedirs(extract_path, exist_ok=True)

    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_path)

    flatten_nested_folder(extract_path)

    return {
        "message": "ZIP uploaded and extracted successfully",
        "project_name": project_name,
        "zip_filename": file.filename,
        "zip_saved_path": zip_path,
        "extracted_to": extract_path
    }