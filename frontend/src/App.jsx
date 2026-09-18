import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Overview from "./pages/Overview";
import Statistics from "./pages/Statistics";
import Visualizations from "./pages/Visualizations";
import AIAnalysis from "./pages/AIAnalysis";
import Anomalies from "./pages/Anomalies";

import "./App.css";


/* =========================================================
   AUTHENTICATED API HELPER
   ========================================================= */

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};


/* =========================================================
   MAIN APPLICATION
   ========================================================= */

function MainApplication() {

  /*
    ---------------------------------------------------------
    Dataset history
    ---------------------------------------------------------
  */

  const [datasetHistory, setDatasetHistory] = useState([]);


  /*
    ---------------------------------------------------------
    Current selected dataset
    ---------------------------------------------------------
  */

  const [selectedDataset, setSelectedDataset] = useState(null);


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

  const [analysis, setAnalysis] = useState(null);


  /*
    ---------------------------------------------------------
    Status / upload message
    ---------------------------------------------------------
  */

  const [message, setMessage] = useState("");


  /*
    ---------------------------------------------------------
    Load dataset history from MongoDB
    ---------------------------------------------------------
  */

  useEffect(() => {

    const loadDatasets = async () => {

      try {

        const response = await fetch(
          "http://localhost:5000/api/datasets",
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );


        const data = await response.json();


        if (!response.ok) {

          throw new Error(
            data.error ||
            data.msg ||
            "Could not load datasets."
          );

        }


        const mongoDatasets = data

          .map((document) => ({
            id: document._id,

            fileName: document.file,

            fileSize:
              document.file_size ?? null,

            fileHash:
              document.file_hash ?? null,

            analysis: document,

            analyzedAt:
              document.created_at,
          }))

          .filter(
            (dataset, index, history) =>
              dataset.fileHash
                ? history.findIndex(
                    (item) =>
                      item.fileHash ===
                      dataset.fileHash
                  ) === index
                : history.findIndex(
                    (item) =>
                      item.id ===
                      dataset.id
                  ) === index
          );


        setDatasetHistory(
          mongoDatasets
        );


        /*
          MongoDB is the source of truth.

          The old localStorage dataset history
          is no longer used.
        */

        localStorage.removeItem(
          "csvAnalysisHistory"
        );


        /*
          Restore previously selected dataset.
        */

        const savedSelectedId =
          localStorage.getItem(
            "selectedCsvDatasetId"
          );


        if (savedSelectedId) {

          const selected =
            mongoDatasets.find(
              (item) =>
                item.id ===
                savedSelectedId
            );


          if (selected) {

            setSelectedDataset(
              selected
            );

            setAnalysis(
              selected.analysis
            );

          } else {

            localStorage.removeItem(
              "selectedCsvDatasetId"
            );

          }

        }

      } catch (error) {

        console.error(
          "Could not load datasets from MongoDB:",
          error
        );

      }

    };


    loadDatasets();

  }, []);


  /*
    ---------------------------------------------------------
    Helper: save selected dataset ID
    ---------------------------------------------------------
  */

  const saveSelectedDataset = (
    dataset
  ) => {

    setSelectedDataset(
      dataset
    );


    if (dataset?.id) {

      localStorage.setItem(
        "selectedCsvDatasetId",
        dataset.id
      );

    } else {

      localStorage.removeItem(
        "selectedCsvDatasetId"
      );

    }

  };


  /*
    ---------------------------------------------------------
    Analyze / load CSV
    ---------------------------------------------------------
  */

  const handleUpload = async () => {

    if (!file) {

      setMessage(
        "Please select a CSV file first."
      );

      return;

    }


    /*
      MongoDB is the source of truth
      for dataset identity.
    */

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );


    try {

      setMessage(
        "Analyzing CSV..."
      );


      const response =
        await fetch(
          "http://localhost:5000/api/upload",
          {
            method: "POST",

            headers: {
              ...getAuthHeaders(),
            },

            body: formData,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setMessage(
          data.error ||
          data.msg ||
          "Upload failed."
        );

        return;

      }


      /*
        The backend should return
        the MongoDB document ID.
      */

      if (!data._id) {

        console.error(
          "Backend response is missing MongoDB _id:",
          data
        );


        setMessage(
          "Backend returned an invalid dataset response."
        );


        return;

      }


      const dataset = {

        id: data._id,

        fileName:
          data.file,

        fileSize:
          data.file_size ??
          file.size,

        fileHash:
          data.file_hash ??
          null,

        analysis:
          data,

        analyzedAt:
          data.created_at,

      };


      setAnalysis(
        data
      );


      saveSelectedDataset(
        dataset
      );


      /*
        Update the in-memory history.

        Existing dataset is replaced instead
        of creating another history entry.
      */

      setDatasetHistory(
        (previousHistory) => {

          const filteredHistory =
            previousHistory.filter(
              (item) =>
                item.id !==
                  dataset.id &&
                (
                  !dataset.fileHash ||
                  item.fileHash !==
                    dataset.fileHash
                )
            );


          return [
            dataset,
            ...filteredHistory,
          ];

        }
      );


      setMessage(

        data.already_analyzed

          ? "This CSV has already been analyzed. Loaded the saved analysis."

          : "CSV analyzed successfully!"

      );


    } catch (error) {

      console.error(
        "CSV analysis error:",
        error
      );


      setMessage(
        "Could not connect to backend."
      );

    }

  };


  /*
    =========================================================
    DASHBOARD SHELL
    =========================================================
  */

  return (

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

            <h2>
              CSV Analyzer
            </h2>


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

                analysis={
                  analysis
                }

                file={
                  file
                }

                setFile={
                  setFile
                }

                message={
                  message
                }

                setMessage={
                  setMessage
                }

                handleUpload={
                  handleUpload
                }

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

                datasetHistory={
                  datasetHistory
                }

                selectedDataset={
                  selectedDataset
                }

                setSelectedDataset={
                  (dataset) => {
                    saveSelectedDataset(
                      dataset
                    );
                  }
                }

                setAnalysis={
                  setAnalysis
                }

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

                analysis={
                  analysis
                }

                selectedDataset={
                  selectedDataset
                }

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

                analysis={
                  analysis
                }

                selectedDataset={
                  selectedDataset
                }

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

                analysis={
                  analysis
                }

                selectedDataset={
                  selectedDataset
                }

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

                analysis={
                  analysis
                }

                selectedDataset={
                  selectedDataset
                }

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

                analysis={
                  analysis
                }

                selectedDataset={
                  selectedDataset
                }

              />

            }
          />


          {/* =================================================
              DEFAULT APPLICATION ROUTE
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

  );

}


/* =========================================================
   ROOT APP
   ========================================================= */

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* =================================================
            STANDALONE AUTHENTICATION
        ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* =================================================
            MAIN APPLICATION
        ================================================= */}

        <Route
          path="/*"
          element={
            <MainApplication />
          }
        />


      </Routes>

    </BrowserRouter>

  );

}


export default App;