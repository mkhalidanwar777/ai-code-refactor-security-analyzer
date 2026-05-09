import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectTrees, setProjectTrees] = useState({});
  const [openProjects, setOpenProjects] = useState({});
  const [openFolders, setOpenFolders] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [uploading, setUploading] = useState(false);

  const apiBase = "http://127.0.0.1:8000";

  const escapeHtml = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const highlightCode = (code) => {
    if (!code) return "";
    let html = escapeHtml(code);

    html = html.replace(/(#.*$)/gm, '<span style="color:#6a9955;">$1</span>');
    html = html.replace(/(\".*?\"|\'.*?\')/g, '<span style="color:#ce9178;">$1</span>');
    html = html.replace(/\b(\d+)\b/g, '<span style="color:#b5cea8;">$1</span>');
    html = html.replace(
      /\b(class|def|return|if|else|elif|for|while|try|except|with|import|from|as|print|in|and|or|not|None|True|False|raise|const|let|var|function)\b/g,
      '<span style="color:#569cd6; font-weight:bold;">$1</span>'
    );
    html = html.replace(/\b(self)\b/g, '<span style="color:#9cdcfe;">$1</span>');

    return html;
  };

  const renderCodeWithLineNumbers = (code, issueLines = []) => {
    if (!code) {
      return <div style={{ color: "#94a3b8", padding: "12px" }}>No file selected</div>;
    }

    return code.split("\n").map((line, index) => {
      const lineNumber = index + 1;
      const isIssueLine = issueLines.includes(lineNumber);

      return (
        <div
          key={lineNumber}
          style={{
            display: "flex",
            backgroundColor: isIssueLine ? "rgba(239,68,68,0.10)" : "transparent",
            borderLeft: isIssueLine ? "3px solid #ef4444" : "3px solid transparent",
          }}
        >
          <div
            style={{
              width: "50px",
              minWidth: "50px",
              textAlign: "right",
              paddingRight: "12px",
              color: isIssueLine ? "#fca5a5" : "#64748b",
              userSelect: "none",
              borderRight: "1px solid rgba(148,163,184,0.12)",
              marginRight: "12px",
            }}
          >
            {lineNumber}
          </div>

          <div
            style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            dangerouslySetInnerHTML={{ __html: highlightCode(line || " ") }}
          />
        </div>
      );
    });
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #071226 0%, #0b1f3a 45%, #08152f 100%)",
    color: "#f8fafc",
    padding: "28px",
    fontFamily: "Arial, sans-serif",
  };

  const containerStyle = { maxWidth: "1500px", margin: "0 auto" };

  const heroStyle = {
    background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(14,165,233,0.12))",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "24px",
  };

  const titleStyle = {
    fontSize: "52px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
    color: "#e2e8f0",
  };

  const subtitleStyle = {
    margin: 0,
    color: "#94a3b8",
    fontSize: "18px",
    lineHeight: 1.6,
  };

  const controlsCardStyle = {
    backgroundColor: "rgba(15,23,42,0.75)",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.2fr 2fr",
    gap: "20px",
    marginTop: "20px",
  };

  const panelStyle = {
    backgroundColor: "rgba(15,23,42,0.82)",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: "18px",
    padding: "18px",
  };

  const panelTitleStyle = {
    fontSize: "30px",
    fontWeight: "bold",
    margin: "0 0 14px 0",
    color: "#f8fafc",
  };

  const buttonStyle = {
    padding: "11px 18px",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    marginLeft: "10px",
  };

  const secondaryButtonStyle = {
    padding: "8px 14px",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  };

  const removeButtonStyle = {
    padding: "8px 14px",
    backgroundColor: "#7f1d1d",
    color: "#fecaca",
    border: "1px solid rgba(248,113,113,0.35)",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  };

  const activeItemStyle = {
    padding: "12px",
    marginBottom: "10px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    borderRadius: "12px",
    cursor: "pointer",
  };

  const normalItemStyle = {
    padding: "12px",
    marginBottom: "10px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    cursor: "pointer",
  };

  const codeBlockStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(148,163,184,0.10)",
    padding: "16px",
    borderRadius: "14px",
    minHeight: "220px",
    overflowX: "auto",
    color: "#e2e8f0",
    fontSize: "14px",
    lineHeight: 1.8,
    fontFamily: "Consolas, Monaco, monospace",
  };

  const messageStyle = {
    marginBottom: "18px",
    padding: "12px 16px",
    backgroundColor: "#13233f",
    border: "1px solid rgba(59,130,246,0.30)",
    borderRadius: "12px",
    color: "#93c5fd",
    fontWeight: "bold",
  };

  const emptyTextStyle = { color: "#94a3b8", fontSize: "16px" };

  const issueCardStyle = (severity) => {
    let borderColor = "rgba(148,163,184,0.18)";
    if (severity === "High") borderColor = "rgba(239,68,68,0.45)";
    if (severity === "Medium") borderColor = "rgba(245,158,11,0.45)";
    if (severity === "Low") borderColor = "rgba(34,197,94,0.35)";

    return {
      backgroundColor: "#111827",
      border: `1px solid ${borderColor}`,
      padding: "14px",
      borderRadius: "12px",
      marginBottom: "12px",
    };
  };

  const badgeStyle = (severity) => {
    let bg = "#334155";
    if (severity === "High") bg = "#dc2626";
    if (severity === "Medium") bg = "#d97706";
    if (severity === "Low") bg = "#059669";

    return {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "999px",
      backgroundColor: bg,
      color: "white",
      fontWeight: "bold",
      fontSize: "12px",
      marginLeft: "10px",
    };
  };

  const getProjects = async () => {
    try {
      setLoadingProjects(true);
      setStatusMessage("Loading projects...");

      const res = await fetch(`${apiBase}/project/list`);
      const data = await res.json();

      setProjects(data.projects || []);
      setProjectTrees({});
      setSelectedItems([]);
      setContent("");
      setAnalysis(null);
      setSelectedProject("");
      setSelectedFile("");
      setStatusMessage("Projects loaded successfully.");
    } catch {
      setStatusMessage("Could not load projects. Make sure backend is running.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadProjectTree = async (project) => {
    const res = await fetch(`${apiBase}/project/tree/${project}`);
    const data = await res.json();

    setProjectTrees((prev) => ({
      ...prev,
      [project]: data.tree || [],
    }));
  };

  const toggleProject = async (project) => {
    setSelectedProject(project);
    setOpenProjects((prev) => ({
      ...prev,
      [project]: !prev[project],
    }));

    if (!projectTrees[project]) {
      await loadProjectTree(project);
    }
  };

  const toggleFolder = (folderKey) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const addFileToFilesSection = (project, fileNode) => {
    const item = {
      project,
      name: fileNode.name,
      path: fileNode.path,
      type: "file",
    };

    setSelectedProject(project);
    setSelectedFile(fileNode.path);

    setSelectedItems((prev) => {
      const exists = prev.some(
        (x) => x.project === item.project && x.path === item.path && x.type === "file"
      );
      if (exists) return prev;
      return [...prev, item];
    });

    setStatusMessage(`Added file "${fileNode.name}" to Files section.`);
  };

  const addFolderToFilesSection = (project, folderName, folderPath) => {
    const item = {
      project,
      name: folderName,
      path: folderPath,
      type: "folder",
    };

    setSelectedProject(project);
    setSelectedFile(folderPath);

    setSelectedItems((prev) => {
      const exists = prev.some(
        (x) => x.project === project && x.path === folderPath && x.type === "folder"
      );
      if (exists) return prev;
      return [item, ...prev];
    });

    setStatusMessage(`Added folder "${folderName}" to Files section.`);
  };

  const addProjectToFilesSection = (project) => {
    const item = {
      project,
      name: project,
      path: "__FULL_PROJECT__",
      type: "project",
    };

    setSelectedProject(project);
    setSelectedFile("Full Project");

    setSelectedItems((prev) => {
      const exists = prev.some(
        (x) => x.project === project && x.type === "project"
      );
      if (exists) return prev;
      return [item, ...prev];
    });

    setStatusMessage(`Added full project "${project}" to Files section.`);
  };

  const removeSelectedItem = (project, path, type) => {
    setSelectedItems((prev) =>
      prev.filter(
        (item) =>
          !(item.project === project && item.path === path && item.type === type)
      )
    );

    if (selectedProject === project && (selectedFile === path || selectedFile === "Full Project")) {
      setSelectedFile("");
      setContent("");
      setAnalysis(null);
    }

    setStatusMessage("Removed item from Files section.");
  };

  const renderProjectTree = (project, nodes, level = 0, parentPath = "") => {
    return nodes.map((node) => {
      const nodeKey = `${project}/${parentPath}/${node.name}`;
      const isFolder = node.type === "folder";
      const isOpen = openFolders[nodeKey];

      if (isFolder) {
        const folderPath = parentPath
          ? `${parentPath}/${node.name}`.replace(/^\/+/, "")
          : node.name;

        return (
          <div key={nodeKey}>
            <div
              onClick={() => toggleFolder(nodeKey)}
              style={{
                padding: "9px",
                marginLeft: `${level * 16}px`,
                marginBottom: "6px",
                backgroundColor: "#1e293b",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {isOpen ? "▼" : "▶"} 📁 {node.name}

              <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addFolderToFilesSection(project, node.name, folderPath);
                  }}
                  style={secondaryButtonStyle}
                >
                  Add Folder
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    analyzeFolder(project, folderPath);
                  }}
                  style={secondaryButtonStyle}
                >
                  Analyze Folder
                </button>
              </div>
            </div>

            {isOpen &&
              node.children &&
              renderProjectTree(project, node.children, level + 1, folderPath)}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          onClick={() => addFileToFilesSection(project, node)}
          style={{
            padding: "9px",
            marginLeft: `${level * 16}px`,
            marginBottom: "6px",
            backgroundColor: selectedFile === node.path ? "#2563eb" : "#111827",
            borderRadius: "10px",
            cursor: "pointer",
            wordBreak: "break-word",
          }}
        >
          📄 {node.name}
        </div>
      );
    });
  };

  const getFileContent = async (project, filePath) => {
    try {
      setSelectedProject(project);
      setSelectedFile(filePath);
      setStatusMessage(`Loading content of "${filePath}"...`);

      const res = await fetch(
        `${apiBase}/project/file-content/${project}?file_path=${encodeURIComponent(filePath)}`
      );
      const data = await res.json();

      setContent(data.content || "No content found.");
      setStatusMessage(`Showing content of "${filePath}".`);
    } catch {
      setStatusMessage("Could not load file content.");
    }
  };

  const analyzeFile = async (project, filePath) => {
    try {
      setLoadingAnalysis(true);
      setSelectedProject(project);
      setSelectedFile(filePath);
      setStatusMessage(`Analyzing "${filePath}"...`);

      const res = await fetch(
        `${apiBase}/analyze/file?project_name=${project}&file_path=${encodeURIComponent(filePath)}`
      );
      const data = await res.json();

      setAnalysis(data);
      setContent(data.original_code || content);
      setStatusMessage(`Analysis completed for "${filePath}".`);
    } catch {
      setStatusMessage("Could not analyze file.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const analyzeProject = async (project) => {
    try {
      setLoadingAnalysis(true);
      setSelectedProject(project);
      setSelectedFile("Full Project");
      setStatusMessage(`Analyzing full project "${project}"...`);

      const res = await fetch(`${apiBase}/analyze/project?project_name=${project}`);
      const data = await res.json();

      setAnalysis(data);
      setContent(data.original_code || "");
      setStatusMessage(`Full project analysis completed for "${project}".`);
    } catch {
      setStatusMessage("Could not analyze full project.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const analyzeFolder = async (project, folderPath) => {
    try {
      setLoadingAnalysis(true);
      setSelectedProject(project);
      setSelectedFile(folderPath);
      setStatusMessage(`Analyzing folder "${folderPath}"...`);

      const res = await fetch(
        `${apiBase}/analyze/folder?project_name=${project}&folder_path=${encodeURIComponent(folderPath)}`
      );

      const data = await res.json();

      setAnalysis(data);
      setContent(data.original_code || "");
      setStatusMessage(`Folder analysis completed for "${folderPath}".`);
    } catch {
      setStatusMessage("Could not analyze folder.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const uploadZip = async () => {
    if (!file) {
      setStatusMessage("Please choose a ZIP file first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setStatusMessage("This button only accepts ZIP files.");
      return;
    }

    try {
      setUploading(true);
      setStatusMessage("Uploading ZIP file...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiBase}/upload/zip`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const uploadedProject = data.project_name || file.name.replace(".zip", "");

      await getProjects();
      setProjects([uploadedProject]);
      await loadProjectTree(uploadedProject);
      setOpenProjects({ [uploadedProject]: true });
      setSelectedProject(uploadedProject);
      setStatusMessage(data.message || "ZIP uploaded successfully.");
    } catch {
      setStatusMessage("ZIP upload failed. Please check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async () => {
    if (!file) {
      setStatusMessage("Please choose a file first.");
      return;
    }

    if (file.name.toLowerCase().endsWith(".zip")) {
      setStatusMessage("For ZIP files, use the Upload ZIP button.");
      return;
    }

    try {
      setUploading(true);
      setStatusMessage("Uploading single file...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiBase}/upload/file`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const uploadedProject = data.project_name || "single_file_project";
      const uploadedFile = data.filename || file.name;

      await getProjects();
      setProjects([uploadedProject]);
      await loadProjectTree(uploadedProject);
      setOpenProjects({ [uploadedProject]: true });
      setSelectedProject(uploadedProject);

      addFileToFilesSection(uploadedProject, {
        name: uploadedFile,
        path: uploadedFile,
        type: "file",
      });

      await getFileContent(uploadedProject, uploadedFile);
      await analyzeFile(uploadedProject, uploadedFile);

      setStatusMessage(data.message || "Single file uploaded successfully.");
    } catch {
      setStatusMessage("Single file upload failed. Please check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  const issueLines =
    analysis?.issues
      ?.map((issue) => issue.line)
      .filter((line) => typeof line === "number") || [];

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <h1 style={titleStyle}>AI Code Refactor + Security Analyzer 🚀</h1>
          <p style={subtitleStyle}>
            Upload a project ZIP, explore files and folders under Projects, send selected files,
            folders, or full project to Files section, then analyze them.
          </p>
        </div>

        <div style={controlsCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={uploadZip} style={buttonStyle}>
              {uploading ? "Uploading..." : "Upload ZIP"}
            </button>
            <button onClick={uploadSingleFile} style={buttonStyle}>
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            <button onClick={getProjects} style={buttonStyle}>
              {loadingProjects ? "Loading..." : "Load Projects"}
            </button>
          </div>
        </div>

        {statusMessage && <div style={messageStyle}>{statusMessage}</div>}

        <div style={gridStyle}>
          <div style={panelStyle}>
            <h2 style={panelTitleStyle}>Projects</h2>

            {projects.length === 0 ? (
              <p style={emptyTextStyle}>No projects loaded</p>
            ) : (
              projects.map((project) => (
                <div key={project}>
                  <div
                    onClick={() => toggleProject(project)}
                    style={selectedProject === project ? activeItemStyle : normalItemStyle}
                  >
                    {openProjects[project] ? "▼" : "▶"} 📦 {project}
                  </div>

                  <button
                    onClick={() => addProjectToFilesSection(project)}
                    style={{ ...secondaryButtonStyle, marginBottom: "10px" }}
                  >
                    Add Full Project to Files
                  </button>

                  <button
                    onClick={() => analyzeProject(project)}
                    style={{ ...secondaryButtonStyle, marginLeft: "8px", marginBottom: "10px" }}
                  >
                    {loadingAnalysis && selectedFile === "Full Project"
                      ? "Analyzing..."
                      : "Analyze Full Project"}
                  </button>

                  {openProjects[project] &&
                    projectTrees[project] &&
                    renderProjectTree(project, projectTrees[project], 1)}
                </div>
              ))
            )}
          </div>

          <div style={panelStyle}>
            <h2 style={panelTitleStyle}>Files</h2>

            {selectedItems.length === 0 ? (
              <p style={emptyTextStyle}>Click files/folders/project from Projects to add here</p>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={`${item.project}-${item.path}-${item.type}`}
                  style={
                    selectedFile === item.path || selectedFile === "Full Project"
                      ? activeItemStyle
                      : normalItemStyle
                  }
                >
                  <div style={{ fontWeight: "bold", marginBottom: "8px", wordBreak: "break-word" }}>
                    {item.type === "project" ? "📦" : item.type === "folder" ? "📁" : "📄"} {item.name}
                  </div>

                  <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "10px" }}>
                    {item.type === "project"
                      ? "Full project analysis"
                      : item.type === "folder"
                      ? `${item.project}/${item.path}`
                      : `${item.project}/${item.path}`}
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {item.type === "file" && (
                      <button
                        onClick={() => getFileContent(item.project, item.path)}
                        style={secondaryButtonStyle}
                      >
                        View
                      </button>
                    )}

                    <button
                      onClick={() =>
                        item.type === "project"
                          ? analyzeProject(item.project)
                          : item.type === "folder"
                          ? analyzeFolder(item.project, item.path)
                          : analyzeFile(item.project, item.path)
                      }
                      style={secondaryButtonStyle}
                    >
                      Analyze
                    </button>

                    <button
                      onClick={() => removeSelectedItem(item.project, item.path, item.type)}
                      style={removeButtonStyle}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={panelStyle}>
            <h2 style={panelTitleStyle}>Selected Project</h2>
            <div
              style={{
                marginBottom: "14px",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "#111827",
                color: "#93c5fd",
                fontWeight: "bold",
              }}
            >
              {selectedProject || "No project selected"}
            </div>

            <h2 style={panelTitleStyle}>Selected File / Folder</h2>
            <div
              style={{
                marginBottom: "14px",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "#111827",
                color: "#cbd5e1",
                wordBreak: "break-word",
              }}
            >
              {selectedFile || "No file selected"}
            </div>

            <h2 style={panelTitleStyle}>File Content</h2>
            <div style={codeBlockStyle}>
              {renderCodeWithLineNumbers(content || "No file selected", issueLines)}
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle, marginTop: "20px" }}>
          <h2 style={panelTitleStyle}>Analysis Result</h2>

          {!analysis ? (
            <p style={emptyTextStyle}>No analysis yet</p>
          ) : (
            <div>
              <div
                style={{
                  marginBottom: "16px",
                  padding: "14px",
                  backgroundColor: "#111827",
                  borderRadius: "12px",
                }}
              >
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Total Issues:</strong> {analysis.total_issues ?? 0}
                </p>

                {analysis.total_files !== undefined && (
                  <p style={{ margin: "0 0 8px 0" }}>
                    <strong>Total Files:</strong> {analysis.total_files}
                  </p>
                )}

                <p style={{ margin: 0 }}>
                  <strong>File/Project/Folder:</strong>{" "}
                  {analysis.file_path || analysis.folder_path || analysis.project_name || "N/A"}
                </p>
              </div>

              {analysis.files && analysis.files.length > 0 && (
                <>
                  <h2 style={{ ...panelTitleStyle, marginTop: "20px" }}>Grouped File Results</h2>

                  {analysis.files.map((fileResult, index) => (
                    <div key={index} style={issueCardStyle("Medium")}>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>File:</strong> {fileResult.file_path}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Issues:</strong> {fileResult.total_issues}
                      </p>
                    </div>
                  ))}
                </>
              )}

              {analysis.issues && analysis.issues.length > 0 ? (
                analysis.issues.map((issue, index) => (
                  <div key={index} style={issueCardStyle(issue.severity)}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>{issue.type}</strong>
                      <span style={badgeStyle(issue.severity)}>{issue.severity}</span>
                    </div>
                    {issue.line && (
                      <p style={{ margin: "0 0 6px 0" }}>
                        <strong>Line:</strong> {issue.line}
                      </p>
                    )}
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Message:</strong> {issue.message}
                    </p>
                    {issue.suggestion && (
                      <p style={{ margin: 0, color: "#93c5fd" }}>
                        <strong>Suggestion:</strong> {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                !analysis.files && <p style={emptyTextStyle}>No issues found.</p>
              )}

              {analysis.original_code && (
                <>
                  <h2 style={{ ...panelTitleStyle, marginTop: "20px" }}>Original Code</h2>
                  <div style={codeBlockStyle}>
                    {renderCodeWithLineNumbers(analysis.original_code, issueLines)}
                  </div>
                </>
              )}

              {analysis.refactored_code && (
                <>
                  <h2 style={{ ...panelTitleStyle, marginTop: "20px" }}>Refactored Code</h2>
                  <div style={codeBlockStyle}>
                    {renderCodeWithLineNumbers(analysis.refactored_code, issueLines)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;