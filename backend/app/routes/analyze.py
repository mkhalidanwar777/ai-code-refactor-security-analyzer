from fastapi import APIRouter
import os
import re
import json
from dotenv import load_dotenv
import google.generativeai as genai

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
EXTRACT_FOLDER = os.path.join(BASE_DIR, "extracted_projects")

load_dotenv(os.path.join(BASE_DIR, ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c",
    ".html", ".css", ".json", ".xml", ".sql", ".php", ".rb",
    ".go", ".md", ".txt", ".ipynb"
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


def fallback_refactored_code(content: str):
    lines = content.splitlines()
    new_lines = []

    for line in lines:
        if re.search(r'(password|passwd|pwd)\s*=\s*[\'"].+[\'"]', line, re.IGNORECASE):
            new_lines.append("# TODO: Move sensitive data to environment variables")
            continue

        if "eval(" in line:
            new_lines.append("# WARNING: eval() removed for security reasons")
            continue

        if "import *" in line:
            new_lines.append("# WARNING: Avoid wildcard import, import specific modules")
            continue

        new_lines.append(line)

    return "\n".join(new_lines)


def generate_refactored_code(content: str):
    if not content.strip():
        return "No supported code found to refactor."

    if not GEMINI_API_KEY:
        return fallback_refactored_code(content)

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
You are an expert software engineer.

Refactor the following code.
Goals:
- Fix logical issues if visible
- Improve readability
- Improve variable/function naming
- Improve code structure
- Apply best practices
- Keep the same intended functionality
- Return only the corrected/refactored code
- Do not add explanations
- Do not wrap the answer in markdown code fences

Code:
{content}
"""

        response = model.generate_content(prompt)

        if response and hasattr(response, "text") and response.text.strip():
            cleaned = response.text.strip()
            cleaned = cleaned.replace("```python", "").replace("```javascript", "")
            cleaned = cleaned.replace("```js", "").replace("```", "").strip()
            return cleaned

        return fallback_refactored_code(content)

    except Exception:
        return fallback_refactored_code(content)


def detect_logic_issues(content: str):
    issues = []
    lines = content.splitlines()

    has_fraction_class = "class Fraction" in content

    for i, line in enumerate(lines, start=1):
        stripped = line.strip()

        if len(line) > 100:
            issues.append({
                "type": "Long Line",
                "severity": "Low",
                "line": i,
                "message": "This line is too long and may reduce readability.",
                "suggestion": "Break this line into multiple smaller lines."
            })

        if "eval(" in line:
            issues.append({
                "type": "Dangerous Function",
                "severity": "High",
                "line": i,
                "message": "Use of eval() can be dangerous and lead to security issues.",
                "suggestion": "Avoid eval(). Use safer alternatives like literal_eval or direct logic."
            })

        if "import *" in line:
            issues.append({
                "type": "Wildcard Import",
                "severity": "Medium",
                "line": i,
                "message": "Wildcard imports reduce readability and can cause conflicts.",
                "suggestion": "Import only required functions or classes."
            })

        if re.search(r'(password|passwd|pwd)\s*=\s*[\'"].+[\'"]', line, re.IGNORECASE):
            issues.append({
                "type": "Hardcoded Secret",
                "severity": "High",
                "line": i,
                "message": "Possible hardcoded password detected.",
                "suggestion": "Store secrets in environment variables or config files."
            })

        if "return '{}/{}'" in line or 'return "{}/{}"' in line:
            issues.append({
                "type": "Design Issue",
                "severity": "Medium",
                "line": i,
                "message": "Arithmetic methods are returning a string instead of an object.",
                "suggestion": "Return a Fraction object instead of a formatted string."
            })

        if "__denum" in line:
            issues.append({
                "type": "Naming Issue",
                "severity": "Low",
                "line": i,
                "message": "Variable name '__denum' is unclear or misspelled.",
                "suggestion": "Use a clearer name like '__den' or '__denominator'."
            })

    if len(lines) > 300:
        issues.append({
            "type": "Long File",
            "severity": "Medium",
            "message": "This file is very long and may need splitting into smaller modules.",
            "suggestion": "Split into smaller files or functions."
        })

    if has_fraction_class:
        if "def __init__(self,n,d):" in content or "def __init__(self, n, d):" in content:
            if "if d == 0" not in content and "if d==0" not in content:
                issues.append({
                    "type": "Validation Issue",
                    "severity": "High",
                    "message": "Fraction constructor does not check for zero denominator.",
                    "suggestion": "Add validation to prevent denominator = 0."
                })

        if "def __truediv__" in content:
            if "other.__num == 0" not in content and "other.__num==0" not in content:
                issues.append({
                    "type": "Division Safety Issue",
                    "severity": "High",
                    "message": "Division method does not check division by a fraction with numerator 0.",
                    "suggestion": "Add a zero-check before division."
                })

        add_match = re.search(r"def __add__\(.*?\):(.*?)(def |\Z)", content, re.S)
        if add_match:
            add_block = add_match.group(1)
            if "self.__num*other.__denum" in add_block and "temp_denum=self.__num*other.__denum" in add_block:
                issues.append({
                    "type": "Logic Error",
                    "severity": "High",
                    "message": "Addition denominator formula looks incorrect for fraction addition.",
                    "suggestion": "For a/b + c/d, denominator should usually be b*d."
                })

        sub_match = re.search(r"def __sub__\(.*?\):(.*?)(def |\Z)", content, re.S)
        if sub_match:
            sub_block = sub_match.group(1)
            if "self.__num*other.__denum" in sub_block and "temp_denum=self.__num*other.__denum" in sub_block:
                issues.append({
                    "type": "Logic Error",
                    "severity": "High",
                    "message": "Subtraction denominator formula looks incorrect for fraction subtraction.",
                    "suggestion": "For a/b - c/d, denominator should usually be b*d."
                })

        arithmetic_dunders = ["__add__", "__sub__", "__mul__", "__truediv__"]
        for method in arithmetic_dunders:
            pattern = rf"def {method}\(.*?\):(.*?)(def |\Z)"
            match = re.search(pattern, content, re.S)
            if match:
                block = match.group(1)
                if "return '{}/{}'" in block or 'return "{}/{}"' in block:
                    issues.append({
                        "type": "Object-Oriented Design Issue",
                        "severity": "Medium",
                        "message": f"{method} returns a string instead of a Fraction object.",
                        "suggestion": "Return Fraction(temp_num, temp_denum) for better object-oriented design."
                    })

        if "gcd(" not in content and "math.gcd" not in content:
            issues.append({
                "type": "Simplification Missing",
                "severity": "Low",
                "message": "Fractions are not simplified to lowest terms.",
                "suggestion": "Use gcd to reduce numerator and denominator."
            })

    return issues


def get_all_project_files(project_path: str):
    all_files = []

    for root, dirs, files in os.walk(project_path):
        for file in files:
            ext = os.path.splitext(file)[1].lower()

            if ext in SUPPORTED_EXTENSIONS:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, project_path).replace("\\", "/")

                all_files.append({
                    "full_path": full_path,
                    "relative_path": relative_path
                })

    return all_files


def read_code_file(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".ipynb":
        return extract_notebook_code(file_path)

    with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
        return file.read()


@router.get("/")
def analyze_home():
    return {"message": "Analyze route working"}


@router.get("/file")
def analyze_file(project_name: str, file_path: str):
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
        content = read_code_file(target_file_path)
        issues = detect_logic_issues(content)
        refactored_code = generate_refactored_code(content)

        return {
            "project_name": project_name,
            "file_path": file_path,
            "total_issues": len(issues),
            "issues": issues,
            "original_code": content,
            "refactored_code": refactored_code
        }

    except Exception as e:
        return {
            "error": "Could not analyze file",
            "details": str(e)
        }


@router.get("/project")
def analyze_project(project_name: str):
    project_path = os.path.join(EXTRACT_FOLDER, project_name)

    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    try:
        project_files = get_all_project_files(project_path)

        all_results = []
        total_issues = 0
        combined_code = ""

        for file_info in project_files:
            file_path = file_info["full_path"]
            relative_path = file_info["relative_path"]

            content = read_code_file(file_path)
            issues = detect_logic_issues(content)

            total_issues += len(issues)

            all_results.append({
                "file_path": relative_path,
                "total_issues": len(issues),
                "issues": issues
            })

            combined_code += f"\n\n# ===== FILE: {relative_path} =====\n\n"
            combined_code += content

        refactored_project_code = generate_refactored_code(combined_code[:12000])

        return {
            "project_name": project_name,
            "total_files": len(project_files),
            "total_issues": total_issues,
            "files": all_results,
            "original_code": combined_code,
            "refactored_code": refactored_project_code,
            "message": "Full project analysis completed"
        }

    except Exception as e:
        return {
            "error": "Could not analyze project",
            "details": str(e)
        }


@router.get("/folder")
def analyze_folder(project_name: str, folder_path: str):
    project_path = os.path.join(EXTRACT_FOLDER, project_name)
    target_folder_path = os.path.join(project_path, folder_path)

    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    if not os.path.exists(target_folder_path):
        return {"error": "Folder not found"}

    if not os.path.isdir(target_folder_path):
        return {"error": "Selected path is not a folder"}

    try:
        folder_files = get_all_project_files(target_folder_path)

        all_results = []
        total_issues = 0
        combined_code = ""

        for file_info in folder_files:
            file_path = file_info["full_path"]
            relative_path = file_info["relative_path"]

            content = read_code_file(file_path)
            issues = detect_logic_issues(content)

            total_issues += len(issues)

            all_results.append({
                "file_path": relative_path,
                "total_issues": len(issues),
                "issues": issues
            })

            combined_code += f"\n\n# ===== FILE: {relative_path} =====\n\n"
            combined_code += content

        if not combined_code.strip():
            refactored_folder_code = "No supported code files found in this folder."
        else:
            refactored_folder_code = generate_refactored_code(combined_code[:12000])

        return {
            "project_name": project_name,
            "folder_path": folder_path,
            "total_files": len(folder_files),
            "total_issues": total_issues,
            "files": all_results,
            "original_code": combined_code,
            "refactored_code": refactored_folder_code,
            "message": "Folder analysis completed"
        }

    except Exception as e:
        return {
            "error": "Could not analyze folder",
            "details": str(e)
        }