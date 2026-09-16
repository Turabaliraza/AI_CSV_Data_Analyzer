import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Overview from "./pages/Overview";
import Statistics from "./pages/Statistics";
import Visualizations from "./pages/Visualizations";
import AIAnalysis from "./pages/AIAnalysis";
import Anomalies from "./pages/Anomalies";

import "./App.css";

function App() {
  /*
    ---------------------------------------------------------
    Load dataset history safely from localStorage
    ---------------------------------------------------------
  */
  const [datasetHistory, setDatasetHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem("csvAnalysisHistory");

      if (!savedHistory) {
        return [];
      }

      const parsedHistory = JSON.parse(savedHistory);

      return Array.isArray(parsedHistory) ? parsedHistory : [];
    } catch (error) {
      console.error("Could not load CSV analysis history:", error);
      return [];
    }
  });

  /*
    ---------------------------------------------------------
    Restore the previously selected dataset
    ---------------------------------------------------------
  */
  const [selectedDataset, setSelectedDataset] = useState(() => {
    try {
      const savedSelectedId = localStorage.getItem(
        "selectedCsvDatasetId"
      );

      if (!savedSelectedId) {
        return null;
      }

      const savedHistory = localStorage.getItem(
        "csvAnalysisHistory"
      );

      if (!savedHistory) {
        return null;
      }

      const parsedHistory = JSON.parse(savedHistory);

      if (!Array.isArray(parsedHistory)) {
        return null;
      }

      const dataset = parsedHistory.find(
        (item) => item.id === savedSelectedId
      );

      return dataset || null;
    } catch (error) {
      console.error(
        "Could not restore selected dataset:",
        error
      );

      return null;
    }
  });

  /*
    ---------------------------------------------------------
    Current uploaded file
    ---------------------------------------------------------
  */
  const [file, setFile] = useState(null);

  /*
    ---------------------------------------------------------
    Current analysis
    ---------------------------------------------------------
  */
  const [analysis, setAnalysis] = useState(() => {
    try {
      const savedSelectedId = localStorage.getItem(
        "selectedCsvDatasetId"
      );

      const savedHistory = localStorage.getItem(
        "csvAnalysisHistory"
      );

      if (!savedSelectedId || !savedHistory) {
        return null;
      }

      const parsedHistory = JSON.parse(savedHistory);

      if (!Array.isArray(parsedHistory)) {
        return null;
      }

      const dataset = parsedHistory.find(
        (item) => item.id === savedSelectedId
      );

      return dataset?.analysis || null;
    } catch (error) {
      console.error(
        "Could not restore selected analysis:",
        error
      );

      return null;
    }
  });

  /*
    ---------------------------------------------------------
    Status / upload message
    ---------------------------------------------------------
  */
  const [message, setMessage] = useState("");

  /*
    ---------------------------------------------------------
    Helper: save selected dataset ID
    ---------------------------------------------------------
  */
  const saveSelectedDataset = (dataset) => {
    setSelectedDataset(dataset);

    if (dataset?.id) {
      localStorage.setItem(
        "selectedCsvDatasetId",
        dataset.id
      );
    } else {
      localStorage.removeItem("selectedCsvDatasetId");
    }
  };

  /*
    ---------------------------------------------------------
    Analyze / load CSV
    ---------------------------------------------------------
  */
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    /*
      -------------------------------------------------------
      Generate a dataset identity using filename + file size
      -------------------------------------------------------
    */
    const datasetId = `${file.name}-${file.size}`;

    /*
      -------------------------------------------------------
      Check local history BEFORE sending anything to Flask
      -------------------------------------------------------
    */
    const existingDataset = datasetHistory.find(
      (dataset) =>
        dataset.id === datasetId ||
        (
          dataset.fileName === file.name &&
          dataset.fileSize === file.size
        )
    );

    /*
      -------------------------------------------------------
      Existing CSV
      -------------------------------------------------------
    */
    if (existingDataset) {
      setAnalysis(existingDataset.analysis);

      saveSelectedDataset(existingDataset);

      setMessage(
        "This CSV has already been analyzed. Loaded the saved analysis."
      );

      return;
    }

    /*
      -------------------------------------------------------
      New CSV
      -------------------------------------------------------
    */
    const formData = new FormData();
    formData.append("file", file);

    try {
      setMessage("Analyzing CSV...");

      const response = await fetch(
        "http://localhost:5000/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Upload failed.");
        return;
      }

      /*
        -----------------------------------------------------
        Create saved dataset object
        -----------------------------------------------------
      */
      const dataset = {
        id: datasetId,
        fileName: data.file,
        fileSize: file.size,
        analysis: data,
        analyzedAt: new Date().toISOString(),
      };

      /*
        -----------------------------------------------------
        Save analysis in React state
        -----------------------------------------------------
      */
      setAnalysis(data);

      /*
        -----------------------------------------------------
        Update dataset history
        -----------------------------------------------------
      */
      setDatasetHistory((previousHistory) => {
        const existingDataset = previousHistory.find(
          (item) =>
            item.id === dataset.id ||
            (
              item.fileName === dataset.fileName &&
              item.fileSize === dataset.fileSize
            )
        );

        let updatedHistory;

        if (existingDataset) {
          updatedHistory = previousHistory.map((item) =>
            item.id === existingDataset.id
              ? dataset
              : item
          );
        } else {
          updatedHistory = [
            dataset,
            ...previousHistory,
          ];
        }

        try {
          localStorage.setItem(
            "csvAnalysisHistory",
            JSON.stringify(updatedHistory)
          );
        } catch (error) {
          console.error(
            "Could not save CSV analysis history:",
            error
          );
        }

        return updatedHistory;
      });

      /*
        -----------------------------------------------------
        Select the newly analyzed dataset
        -----------------------------------------------------
      */
      saveSelectedDataset(dataset);

      setMessage("CSV analyzed successfully!");

    } catch (error) {
      console.error("CSV analysis error:", error);

      setMessage(
        "Could not connect to backend."
      );
    }
  };

  return (
    <BrowserRouter>
      <div className="app">

        {/* =================================================
            SIDEBAR
        ================================================= */}
        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-icon">
              AI
            </div>

            <div>
              <h2>CSV Analyzer</h2>
              <span>
                Intelligent Data Analysis
              </span>
            </div>

          </div>


          <nav className="sidebar-nav">

            <NavLink
              to="/dashboard"
              className="nav-item"
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/upload"
              className="nav-item"
            >
              Upload CSV
            </NavLink>

            <NavLink
              to="/overview"
              className="nav-item"
            >
              Overview
            </NavLink>

            <NavLink
              to="/statistics"
              className="nav-item"
            >
              Statistics
            </NavLink>

            <NavLink
              to="/visualizations"
              className="nav-item"
            >
              Visualizations
            </NavLink>

            <NavLink
              to="/ai-analysis"
              className="nav-item"
            >
              AI Analysis
            </NavLink>

            <NavLink
              to="/anomalies"
              className="nav-item"
            >
              Anomalies
            </NavLink>

            <div className="nav-item">
              Settings
            </div>

          </nav>


          <div className="sidebar-footer">

            <span>
              Universal CSV Analyzer
            </span>

            <span>
              Python • Flask • React • AI
            </span>

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
                UPLOAD / HISTORY
            ================================================= */}
            <Route
              path="/upload"
              element={
                <Upload
                  datasetHistory={datasetHistory}
                  selectedDataset={selectedDataset}
                  setSelectedDataset={(dataset) => {
                    saveSelectedDataset(dataset);
                  }}
                  setAnalysis={setAnalysis}
                />
              }
            />


            {/* =================================================
                OVERVIEW
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