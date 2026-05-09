from fastapi import APIRouter
import os
import json

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
EXTRACT_FOLDER = os.path.join(BASE_DIR, "extracted_projects")

SUPPORTED_CODE_EXTENSIONS = {
    ".py", ".js", ".ts", ".java", ".cpp", ".c", ".cs",
    ".php", ".html", ".css", ".json", ".xml", ".sql",
    ".go", ".rb", ".txt", ".md", ".ipynb"
}


def extract_notebook_code(notebook_path: str):
    with open(notebook_path, "r", encoding="utf-8") as file:
        notebook_data = json.load(file)

    code_blocks = []

    for cell in notebook_data.get("cells", []):
        if cell.get("cell_type") == "code":
            source = cell.get("source", [])
            code_blocks.append("".join(source))

    return "\n\n".join(code_blocks)


@router.get("/")
def project_home():
    return {"message": "Project route working"}


@router.get("/list")
def list_extracted_projects():
    if not os.path.exists(EXTRACT_FOLDER):
        return {"projects": []}

    projects = []
    for item in os.listdir(EXTRACT_FOLDER):
        item_path = os.path.join(EXTRACT_FOLDER, item)
        if os.path.isdir(item_path):
            projects.append(item)

    return {"projects": projects}


@router.get("/files/{project_name}")
def get_project_files(project_name: str):
    project_path = os.path.join(EXTRACT_FOLDER, project_name)

    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    all_files = []

    for root, dirs, files in os.walk(project_path):
        for file in files:
            file_extension = os.path.splitext(file)[1].lower()

            if file_extension in SUPPORTED_CODE_EXTENSIONS:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, project_path).replace("\\", "/")

                if relative_path.startswith(project_name + "/"):
                    relative_path = relative_path[len(project_name) + 1:]

                all_files.append(relative_path)

    return {
        "project_name": project_name,
        "total_files": len(all_files),
        "files": all_files
    }


@router.get("/file-content/{project_name}")
def get_file_content(project_name: str, file_path: str):
    project_path = os.path.join(EXTRACT_FOLDER, project_name)

    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    possible_paths = [
        os.path.join(project_path, file_path),
        os.path.join(project_path, project_name, file_path)
    ]

    target_file_path = None
    for path in possible_paths:
        if os.path.exists(path):
            target_file_path = path
            break

    if not target_file_path:
        return {"error": "File not found"}

    try:
        file_extension = os.path.splitext(target_file_path)[1].lower()

        if file_extension == ".ipynb":
            content = extract_notebook_code(target_file_path)
        else:
            with open(target_file_path, "r", encoding="utf-8") as file:
                content = file.read()

        return {
            "project_name": project_name,
            "file_path": file_path,
            "content": content
        }

    except Exception as e:
        return {
            "error": "Could not read file",
            "details": str(e)
        }
    
def build_tree(folder_path, base_path):
    tree = []

    for item in sorted(os.listdir(folder_path)):
        item_path = os.path.join(folder_path, item)

        if os.path.isdir(item_path):
            tree.append({
                "name": item,
                "type": "folder",
                "children": build_tree(item_path, base_path)
            })
        else:
            relative_path = os.path.relpath(item_path, base_path).replace("\\", "/")
            tree.append({
                "name": item,
                "type": "file",
                "path": relative_path
            })

    return tree


@router.get("/tree/{project_name}")
def get_project_tree(project_name: str):
    project_path = os.path.join(EXTRACT_FOLDER, project_name)

    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    return {
        "project_name": project_name,
        "tree": build_tree(project_path, project_path)
    }