import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import "./App.css";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Overview from "./pages/Overview";
import Statistics from "./pages/Statistics";
import Visualizations from "./pages/Visualizations";
import AIAnalysis from "./pages/AIAnalysis";
import Anomalies from "./pages/Anomalies";


function App() {

  // =========================================================
  // BASIC APPLICATION STATE
  // =========================================================

  const [file, setFile] = useState(null);

  const [analysis, setAnalysis] = useState(null);

  const [message, setMessage] = useState("");

  const [selectedChartColumn, setSelectedChartColumn] =
    useState("");


  // =========================================================
  // CSV ANALYSIS HISTORY
  // =========================================================
  // Load previously saved analysis history from localStorage.
  // This allows the history to remain after page refresh.
  // =========================================================

  const [datasetHistory, setDatasetHistory] = useState(() => {

    const savedHistory = localStorage.getItem(
      "csvAnalysisHistory"
    );

    return savedHistory
      ? JSON.parse(savedHistory)
      : [];

  });


  // =========================================================
  // CURRENTLY SELECTED DATASET
  // =========================================================

  const [selectedDataset, setSelectedDataset] =
    useState(null);


  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileChange = (event) => {

    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);

    setAnalysis(null);

    setMessage("");

    setSelectedChartColumn("");

  };


  // =========================================================
  // CSV UPLOAD + ANALYSIS
  // =========================================================

  const handleUpload = () => {

    // -------------------------------------------------------
    // Make sure a file was selected
    // -------------------------------------------------------

    if (!file) {

      setMessage(
        "Please select a CSV file first."
      );

      return;

    }


    // -------------------------------------------------------
    // Prepare form data
    // -------------------------------------------------------

    const formData = new FormData();

    formData.append(
      "file",
      file
    );


    // -------------------------------------------------------
    // Send CSV to Flask backend
    // -------------------------------------------------------

    fetch(
      "http://127.0.0.1:5000/api/upload",
      {
        method: "POST",
        body: formData,
      }
    )

      .then((response) => response.json())

      .then((data) => {

        // ===================================================
        // BACKEND ERROR
        // ===================================================

        if (data.error) {

          setMessage(
            data.error
          );

          return;

        }


        // ===================================================
        // SUCCESS
        // ===================================================

        setMessage(
          data.message
        );


        // ===================================================
        // CREATE DATASET HISTORY OBJECT
        // ===================================================

        const dataset = {

          id: crypto.randomUUID(),

          fileName: file.name,

          fileSize: file.size,

          uploadedAt: new Date().toISOString(),

          analysis: data,

        };


        // ===================================================
        // CHECK WHETHER THIS CSV ALREADY EXISTS
        // ===================================================

        const existingDataset =
          datasetHistory.find(
            (item) =>
              item.fileName === file.name &&
              item.fileSize === file.size
          );


        // ===================================================
        // EXISTING DATASET
        // ===================================================

        if (existingDataset) {

          // Select the existing dataset
          setSelectedDataset(
            existingDataset
          );


          // Reuse the existing analysis
          setAnalysis(
            existingDataset.analysis
          );


          // Set first numeric column for charts
          if (
            existingDataset.analysis.numeric_columns &&
            existingDataset.analysis.numeric_columns.length > 0
          ) {

            setSelectedChartColumn(
              existingDataset.analysis.numeric_columns[0]
            );

          }
          else {

            setSelectedChartColumn("");

          }


          return;

        }


        // ===================================================
        // NEW DATASET
        // ===================================================

        const updatedHistory = [
          dataset,
          ...datasetHistory,
        ];


        // ---------------------------------------------------
        // Update React state
        // ---------------------------------------------------

        setDatasetHistory(
          updatedHistory
        );


        // ---------------------------------------------------
        // Save history in browser
        // ---------------------------------------------------

        localStorage.setItem(
          "csvAnalysisHistory",
          JSON.stringify(
            updatedHistory
          )
        );


        // ---------------------------------------------------
        // Select newly uploaded dataset
        // ---------------------------------------------------

        setSelectedDataset(
          dataset
        );


        // ---------------------------------------------------
        // Store analysis
        // ---------------------------------------------------

        setAnalysis(
          data
        );


        // ---------------------------------------------------
        // Select first numeric column for visualization
        // ---------------------------------------------------

        if (
          data.numeric_columns &&
          data.numeric_columns.length > 0
        ) {

          setSelectedChartColumn(
            data.numeric_columns[0]
          );

        }
        else {

          setSelectedChartColumn("");

        }

      })


      // =====================================================
      // CONNECTION ERROR
      // =====================================================

      .catch((error) => {

        console.error(
          "Upload error:",
          error
        );

        setMessage(
          "Error connecting to Flask."
        );

      });

  };


  // =========================================================
  // APPLICATION LAYOUT
  // =========================================================

  return (

    <BrowserRouter>

      <div className="app">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="sidebar">


          {/* -------------------------------------------------
              BRAND
          ------------------------------------------------- */}

          <div className="brand">

            <div className="brand-icon">
              ▥
            </div>

            <div>

              <h2>
                AI CSV
              </h2>

              <span>
                Data Analyzer
              </span>

            </div>

          </div>


          {/* -------------------------------------------------
              NAVIGATION
          ------------------------------------------------- */}

          <nav className="sidebar-nav">


            {/* DASHBOARD */}

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ⌂
              </span>

              Dashboard

            </NavLink>


            {/* UPLOAD CSV */}

            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ↑
              </span>

              Upload CSV

            </NavLink>


            {/* OVERVIEW */}

            <NavLink
              to="/overview"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ▤
              </span>

              Overview

            </NavLink>


            {/* STATISTICS */}

            <NavLink
              to="/statistics"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ▥
              </span>

              Statistics

            </NavLink>


            {/* VISUALIZATIONS */}

            <NavLink
              to="/visualizations"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ▥
              </span>

              Visualizations

            </NavLink>


            {/* AI ANALYSIS */}

            <NavLink
              to="/ai-analysis"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ✦
              </span>

              AI Analysis

            </NavLink>


            {/* ANOMALIES */}

            <NavLink
              to="/anomalies"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span>
                ⚠
              </span>

              Anomalies

            </NavLink>


          </nav>


          {/* =================================================
              SIDEBAR BOTTOM
          ================================================= */}

          <div className="sidebar-bottom">


            {/* PROFILE */}

            <div className="profile">

              <div className="profile-avatar">
                T
              </div>

              <div>

                <strong>
                  AI CSV Analyzer
                </strong>

                <span>
                  Analytics Platform
                </span>

              </div>

            </div>


            {/* SETTINGS */}

            <div className="nav-item">

              <span>
                ⚙
              </span>

              Settings

            </div>


          </div>


        </aside>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="main-content">


          <Routes>


            {/* =================================================
                DASHBOARD
            ================================================= */}

            <Route
              path="/dashboard"
              element={
                <Dashboard
                  analysis={analysis}
                  file={file}
                  setFile={setFile}
                  message={message}
                  setMessage={setMessage}
                  handleUpload={handleUpload}
                />
              }
            />


            {/* =================================================
                UPLOAD / CSV HISTORY
            ================================================= */}

            <Route
              path="/upload"
              element={
                <Upload
                  datasetHistory={datasetHistory}
                  selectedDataset={selectedDataset}
                  setSelectedDataset={setSelectedDataset}
                  setAnalysis={setAnalysis}
                />
              }
            />


            {/* =================================================
                DATASET OVERVIEW
            ================================================= */}

            <Route
              path="/overview"
              element={
                <Overview
                  analysis={analysis}
                  selectedDataset={selectedDataset}
                />
              }
            />


            {/* =================================================
                STATISTICS
            ================================================= */}

            <Route
              path="/statistics"
              element={
                <Statistics
                  analysis={analysis}
                  selectedDataset={selectedDataset}
                />
              }
            />


            {/* =================================================
                VISUALIZATIONS
            ================================================= */}

            <Route
              path="/visualizations"
              element={
                <Visualizations
                  analysis={analysis}
                  selectedDataset={selectedDataset}
                />
              }
            />


            {/* =================================================
                AI ANALYSIS
            ================================================= */}

            <Route
              path="/ai-analysis"
              element={
                <AIAnalysis
                  analysis={analysis}
                  selectedDataset={selectedDataset}
                />
              }
            />


            {/* =================================================
                ANOMALIES
            ================================================= */}

            <Route
              path="/anomalies"
              element={
                <Anomalies
                  analysis={analysis}
                  selectedDataset={selectedDataset}
                />
              }
            />


            {/* =================================================
                DEFAULT ROUTE
            ================================================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />


          </Routes>


        </main>


      </div>

    </BrowserRouter>

  );
}


export default App;