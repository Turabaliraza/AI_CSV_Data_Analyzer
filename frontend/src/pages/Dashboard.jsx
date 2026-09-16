import React from "react";

function Dashboard({
  analysis,
  file,
  setFile,
  message,
  setMessage,
  handleUpload,
}) {
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please select a CSV file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setMessage("");
  };

  const handleAnalyze = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    await handleUpload();
  };

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>CSV Data Analyzer</h1>
          <p>
            Upload a CSV file and generate an intelligent analysis of your
            dataset.
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="upload-card">

        <div className="upload-heading">
          <div>
            <h2>Upload CSV Dataset</h2>
            <p>
              Select any CSV file to analyze its structure, statistics and
              anomalies.
            </p>
          </div>
        </div>

        {/* File Selection Area */}
        <label className="file-upload-area">

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            hidden
          />

          <div className="upload-icon">
            ↑
          </div>

          <div className="upload-text">
            <strong>
              {file ? file.name : "Choose a CSV file"}
            </strong>

            <span>
              {file
                ? `${(file.size / 1024).toFixed(2)} KB`
                : "Click here to browse your files"}
            </span>
          </div>

        </label>

        {/* Selected File */}
        {file && (
          <div className="selected-file">

            <div>
              <strong>{file.name}</strong>

              <span>
                {(file.size / 1024).toFixed(2)} KB
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setMessage("");
              }}
            >
              Remove
            </button>

          </div>
        )}

        {/* Message */}
        {message && (
          <div className="upload-message">
            {message}
          </div>
        )}

        {/* Analyze Button */}
        <button
          type="button"
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={!file}
        >
          Analyze CSV
        </button>

      </div>

      {/* Analysis Result */}
      {analysis && (
        <div className="analysis-success-card">

          <div className="success-header">
            <div>
              <h2>Analysis Ready</h2>
              <p>
                Your dataset has been successfully analyzed.
              </p>
            </div>
          </div>

          <div className="success-dataset-name">
            <span>Dataset</span>
            <strong>{analysis.file}</strong>
          </div>

          <div className="quick-stats">

            <div className="quick-stat">
              <span>Rows</span>
              <strong>{analysis.rows}</strong>
            </div>

            <div className="quick-stat">
              <span>Columns</span>
              <strong>{analysis.columns}</strong>
            </div>

            <div className="quick-stat">
              <span>Missing Values</span>
              <strong>{analysis.total_missing_values}</strong>
            </div>

            <div className="quick-stat">
              <span>Anomalies</span>
              <strong>{analysis.anomaly_count}</strong>
            </div>

          </div>

          <div className="analysis-hint">
            Use the sidebar to explore the generated analysis in
            <strong> Overview</strong>, <strong>Statistics</strong>,
            <strong> Visualizations</strong>, <strong>AI Analysis</strong>
            and <strong>Anomalies</strong>.
          </div>

        </div>
      )}

    </div>
  );
}

export default Dashboard;