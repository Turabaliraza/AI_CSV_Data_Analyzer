import { useState } from "react";
import "./App.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedChartColumn, setSelectedChartColumn]=useState("");
  const [activeSection, setActiveSection]=useState("dashboard");

  const handleNavigation=(sectionId)=>{
    setActiveSection(sectionId);

    const section=document.getElementById(sectionId);

    if(section){
      section.scrollIntoView({
        behavior:"smooth",
        block:"start",
      });
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setAnalysis(null);
    setMessage("");
    setSelectedChartColumn("");
  };

  const handleUpload = () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:5000/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage(data.message);
          setAnalysis(data);

        if(data.numeric_columns && data.numeric_columns.length>0)
        {
          setSelectedChartColumn(data.numeric_columns[0]);
        }
        else{
          setSelectedChartColumn("");
        }
        }
      })
      .catch((error) => {
        console.error("Upload error:", error);
        setMessage("Error connecting to Flask.");
      });
  };

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">▥</div>

          <div>
            <h2>AI CSV</h2>
            <span>Data Analyzer</span>
          </div>
        </div>

       <nav className="sidebar-nav">

        <button
         className={`nav-item ${
           activeSection==="dashboard"?"active":""
         }`}
         onClick={() => handleNavigation("dashboard")}
        >
          <span>⌂</span>
          Dashboard
        </button>
        <button 
           className={`nav-item ${
            activeSection==="upload"?"active":""
           }`}
           onClick={()=>handleNavigation("upload")}
        >
          <span>↑</span>
          Upload &amp; Anaylze
        </button>

        <button 
          className={`nav-item ${
            activeSection === "overview"?"active":""
          }`}
          onClick={()=>handleNavigation("overview")}
          >
            <span>▤</span>
            Dataset Overview
          </button>

          <button 
            className={`nav-item ${
              activeSection==="statistics"?"active":""
            }`}
            onClick={()=>handleNavigation("statistics")}
          >
            <span>▥</span>
            Statistics
          </button>

          <button 
            className={`nav-item ${
              activeSection==="ai-analysis"?"active":""
            }`}
            onClick={()=>handleNavigation("ai-analysis")}
          >
            <span>✦</span>
            AI Analysis
          </button>

          <button
            className={`nav-item ${
              activeSection==="anomalies"?"active":""
            }`}
            onClick={()=>handleNavigation("anomalies")}
          >
            <span>⚠</span>
            Anomalies
          </button>
       </nav>

        <div className="sidebar-bottom">

          <div className="profile">
            <div className="profile-avatar">T</div>

            <div>
              <strong>AI CSV Analyzer</strong>
              <span>Analytics Platform</span>
            </div>
          </div>

          <div className="nav-item">
            <span>⚙</span>
            Settings
          </div>

        </div>

      </aside>


      {/* ================= MAIN CONTENT ================= */}
      <main className="main-content" id="dashboard">

        {/* HEADER */}
        <header className="top-header">

          <div>
            <p className="welcome-text">Welcome to</p>

            <h1>
              <span className="gradient-text">AI CSV</span>{" "}
              Data Analyzer
            </h1>

            <p className="subtitle">
              Upload your CSV and get intelligent insights from your data.
            </p>
          </div>

          <div className="header-right">

            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search features..."
              />
            </div>

            <div className="ai-status">
              <span className="status-dot"></span>
              AI Engine Ready
            </div>

          </div>

        </header>


        {/* ================= UPLOAD SECTION ================= */}
        <section className="upload-section" id="upload">

          <div className="upload-card">

            <div className="upload-heading">

              <div className="section-icon upload-icon">
                ↑
              </div>

              <div>
                <h2>Upload CSV File</h2>

                <p>
                  Choose a CSV file from your device to start analysis.
                </p>
              </div>

            </div>

            <div className="upload-area">

              <div className="upload-symbol">
                ↑
              </div>

              <h3>
                Drag & drop your CSV file here
              </h3>

              <p>
                or click the button below to browse
              </p>

              <label className="choose-button">

                Choose CSV File

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />

              </label>

            </div>

            {file && (
              <div className="selected-file">

                <div className="file-info">

                  <div className="file-icon">
                    CSV
                  </div>

                  <div>
                    <strong>{file.name}</strong>
                    <span>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                </div>

                <button
                  className="remove-file"
                  onClick={() => {
                    setFile(null);
                    setAnalysis(null);
                    setMessage("");
                  }}
                >
                  ×
                </button>

              </div>
            )}

            <button
              className="analyze-button"
              onClick={handleUpload}
            >
              Analyze Dataset
              <span>→</span>
            </button>

            {message && (
              <p
                className={
                  message.includes("successfully")
                    ? "success-message"
                    : "error-message"
                }
              >
                {message}
              </p>
            )}

          </div>

        </section>


        {/* ================= ANALYSIS ================= */}
        {analysis && (
          <>

            {/* KPI CARDS */}
            <section className="metrics-grid">

              <div className="metric-card blue-card">

                <div className="metric-icon">▤</div>

                <div>
                  <span>Total Rows</span>
                  <strong>{analysis.rows}</strong>
                  <small>Records in dataset</small>
                </div>

              </div>


              <div className="metric-card purple-card">

                <div className="metric-icon">▥</div>

                <div>
                  <span>Total Columns</span>
                  <strong>{analysis.columns}</strong>
                  <small>Features detected</small>
                </div>

              </div>


              <div className="metric-card orange-card">

                <div className="metric-icon">!</div>

                <div>
                  <span>Missing Values</span>

                  <strong>
                    {Object.values(analysis.missing_values).reduce(
                      (total, value) => total + value,
                      0
                    )}
                  </strong>

                  <small>Missing data points</small>
                </div>

              </div>


              <div className="metric-card pink-card">

                <div className="metric-icon">✦</div>

                <div>
                  <span>AI Anomalies</span>
                  <strong>{analysis.anomaly_count}</strong>
                  <small>Unusual records</small>
                </div>

              </div>

            </section>


            {/* OVERVIEW + STATISTICS */}
            <section className="two-column-grid">

              {/* DATASET OVERVIEW */}
              <div className="dashboard-card"id="overview">

                <div className="card-header">

                  <div className="section-icon blue-icon">
                    ⓘ
                  </div>

                  <div>
                    <h2>Dataset Overview</h2>
                    <p>Basic information about your uploaded dataset</p>
                  </div>

                </div>


                <div className="overview-list">

                  <div className="overview-row">
                    <span>File Name</span>
                    <strong>{analysis.file}</strong>
                  </div>

                  <div className="overview-row">
                    <span>Total Rows</span>
                    <strong>{analysis.rows}</strong>
                  </div>

                  <div className="overview-row">
                    <span>Total Columns</span>
                    <strong>{analysis.columns}</strong>
                  </div>

                  <div className="overview-row column-row">

                    <span>Column Names</span>

                    <div className="tags">

                      {analysis.column_names.map((column) => (
                        <span
                          className="tag"
                          key={column}
                        >
                          {column}
                        </span>
                      ))}

                    </div>

                  </div>

                </div>

              </div>


              {/* STATISTICS */}
              <div className="dashboard-card" id="statistics">

                <div className="card-header">

                  <div className="section-icon purple-icon">
                    ▥
                  </div>

                  <div>
                    <h2>Statistical Summary</h2>
                    <p>Summary statistics for numeric columns</p>
                  </div>

                </div>


                <div className="table-wrapper">

                  <table className="modern-table">

                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Mean</th>
                        <th>Minimum</th>
                        <th>Maximum</th>
                      </tr>
                    </thead>

                    <tbody>

                      {Object.entries(analysis.statistics).map(
                        ([column, values]) => (
                          <tr key={column}>
                            <td>{column}</td>
                            <td>{values.mean}</td>
                            <td>{values.min}</td>
                            <td>{values.max}</td>
                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </section>
            {/* ================= DYNAMIC CHART ================= */}
{analysis.preview &&
  analysis.preview.length > 0 &&
  analysis.numeric_columns &&
  analysis.numeric_columns.length > 0 && (
    <section className="dashboard-card chart-card" id="visualizations">

      <div className="card-header">

        <div className="section-icon purple-icon">
          ▥
        </div>

        <div>
          <h2>
            {selectedChartColumn
              ? `${selectedChartColumn} Distribution`
              : "Data Visualization"}
          </h2>

          <p>
            Visualization of a numeric column from your dataset
          </p>
        </div>

        <div className="chart-type">

          <select
            value={selectedChartColumn}
            onChange={(event) =>
              setSelectedChartColumn(event.target.value)
            }
          >

            {analysis.numeric_columns.map((column) => (
              <option
                key={column}
                value={column}
              >
                {column}
              </option>
            ))}

          </select>

        </div>

      </div>

      <div className="chart-container">

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <BarChart
            data={analysis.preview}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
            />

            <XAxis
              dataKey={analysis.column_names[0]}
              stroke="#9ca3af"
            />

            <YAxis
              stroke="#9ca3af"
            />

            <Tooltip
              contentStyle={{
                background: "#151a2b",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                color: "#ffffff",
              }}
            />

            <Legend />

            <Bar
              dataKey={selectedChartColumn}
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
            />

            <defs>

              <linearGradient
                id="barGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stopColor="#a855f7"
                />

                <stop
                  offset="100%"
                  stopColor="#3b82f6"
                />

              </linearGradient>

            </defs>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </section>
  )}
            {/* ================= ANOMALY SECTION ================= */}
            <section className="two-column-grid bottom-grid">

              <div className="dashboard-card anomaly-card" id="ai-analysis">

                <div className="card-header">

                  <div className="section-icon pink-icon">
                    ✦
                  </div>

                  <div>
                    <h2>AI Anomaly Detection</h2>

                    <p>
                      Using Isolation Forest to detect unusual records
                    </p>
                  </div>

                </div>


                <div className="anomaly-alert">

                  <div className="alert-icon">
                    !
                  </div>

                  <div>

                    <h3>
                      {analysis.anomaly_count}{" "}
                      {analysis.anomaly_count === 1
                        ? "Anomaly"
                        : "Anomalies"}{" "}
                      Detected
                    </h3>

                    <p>
                      Our AI model found{" "}
                      {analysis.anomaly_count} record
                      {analysis.anomaly_count === 1 ? "" : "s"} that
                      appear unusual compared to the rest of the data.
                    </p>

                  </div>

                </div>


                <div className="ai-details">

                  <div>
                    <span>Numeric Columns</span>
                    <strong>
                      {analysis.numeric_columns.join(", ")}
                    </strong>
                  </div>

                  <div>
                    <span>Anomaly Count</span>
                    <strong>{analysis.anomaly_count}</strong>
                  </div>

                </div>


                {analysis.anomalous_rows.length > 0 ? (

                  <div className="table-wrapper" id="anomalies">

                    <table className="modern-table anomaly-table">

                      <thead>

                        <tr>

                          {Object.keys(
                            analysis.anomalous_rows[0]
                          ).map((column) => (
                            <th key={column}>
                              {column}
                            </th>
                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {analysis.anomalous_rows.map(
                          (row, index) => (

                            <tr key={index}>

                              {Object.values(row).map(
                                (value, columnIndex) => (

                                  <td key={columnIndex}>
                                    {value}
                                  </td>

                                )
                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="no-anomaly">
                    ✓ No anomalies detected
                  </div>

                )}

              </div>


              {/* DATASET PREVIEW */}
              <div className="dashboard-card">

                <div className="card-header">

                  <div className="section-icon blue-icon">
                    ▤
                  </div>

                  <div>
                    <h2>Dataset Preview</h2>
                    <p>First rows of your uploaded dataset</p>
                  </div>

                  <span className="rows-badge">
                    {analysis.rows} rows
                  </span>

                </div>


                {analysis.data && (

                  <div className="table-wrapper">

                    <table className="modern-table preview-table">

                      <thead>

                        <tr>

                          <th>#</th>

                          {Object.keys(
                            analysis.data[0]
                          ).map((column) => (

                            <th key={column}>
                              {column}
                            </th>

                          ))}

                        </tr>

                      </thead>


                      <tbody>

                        {analysis.data.map(
                          (row, index) => (

                            <tr key={index}>

                              <td>{index + 1}</td>

                              {Object.values(row).map(
                                (value, columnIndex) => (

                                  <td key={columnIndex}>
                                    {value}
                                  </td>

                                )
                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </section>

          </>
        )}

      </main>

    </div>
  );
}

export default App;