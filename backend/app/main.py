from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.analyze import router as analyze_router
from app.routes.project import router as project_router

app = FastAPI(
    title="AI Code Refactor + Security Analyzer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["Analyze"])
app.include_router(project_router, prefix="/project", tags=["Project"])


@app.get("/")
def root():
    return {
        "message": "Backend is running successfully",
        "project": "AI Code Refactor + Security Analyzer"
    }