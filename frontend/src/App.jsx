import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
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
   PROTECTED ROUTE
   ========================================================= */

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


/* =========================================================
   AUTH ROUTE
   Prevent logged-in users from opening login/register
   ========================================================= */

function AuthRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


/* =========================================================
   SETTINGS PAGE
   ========================================================= */

function Settings() {
  const navigate = useNavigate();

  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(null);


  /* ---------------------------------------------------------
     Get current user
     --------------------------------------------------------- */

  const getCurrentUser = () => {
    try {
      const storedUser =
        localStorage.getItem("currentUser");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);

    } catch (error) {

      console.error(
        "Could not read current user:",
        error
      );

      return null;
    }
  };


  const currentUser = getCurrentUser();


  /* ---------------------------------------------------------
     Read JWT expiration and run countdown
     --------------------------------------------------------- */

  useEffect(() => {

    const calculateRemainingTime = () => {

      const token =
        localStorage.getItem("accessToken");


      if (!token) {

        setRemainingSeconds(null);

        return;

      }


      try {

        const tokenParts =
          token.split(".");


        if (tokenParts.length !== 3) {

          console.error(
            "Invalid JWT format."
          );

          setRemainingSeconds(null);

          return;

        }


        /*
          Decode the JWT payload.

          JWT payloads use Base64URL encoding,
          so convert it into normal Base64 first.
        */

        const base64Payload =
          tokenParts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");


        const payload =
          JSON.parse(
            atob(base64Payload)
          );


        if (!payload.exp) {

          console.error(
            "JWT does not contain an expiration time."
          );

          setRemainingSeconds(null);

          return;

        }


        const expirationTime =
          payload.exp * 1000;


        const now =
          Date.now();


        const remaining =
          Math.max(
            0,
            Math.floor(
              (expirationTime - now) / 1000
            )
          );


        setRemainingSeconds(
          remaining
        );


        /*
          Calculate the original session duration.

          JWT `iat` = issued-at timestamp.
          JWT `exp` = expiration timestamp.
        */

        if (payload.iat) {

          const totalDuration =
            Math.max(
              1,
              payload.exp - payload.iat
            );


          setSessionDuration(
            totalDuration
          );

        }


        /*
          Automatically log out when
          the JWT reaches zero.
        */

        if (remaining <= 0) {

          localStorage.removeItem(
            "accessToken"
          );

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "currentUser"
          );

          localStorage.removeItem(
            "selectedCsvDatasetId"
          );

          localStorage.removeItem(
            "selectedCsvDataset"
          );

          navigate(
            "/login",
            {
              replace: true,
            }
          );

        }

      } catch (error) {

        console.error(
          "Could not read JWT expiration:",
          error
        );

      }

    };


    /*
      Calculate immediately when Settings loads.
    */

    calculateRemainingTime();


    /*
      Update countdown every second.
    */

    const timer =
      setInterval(
        calculateRemainingTime,
        1000
      );


    return () =>
      clearInterval(timer);

  }, [navigate]);


  /* ---------------------------------------------------------
     Format remaining time
     --------------------------------------------------------- */

  const formatRemainingTime = () => {

    if (
      remainingSeconds === null
    ) {

      return "--:--";

    }


    const hours =
      Math.floor(
        remainingSeconds / 3600
      );


    const minutes =
      Math.floor(
        (remainingSeconds % 3600) / 60
      );


    const seconds =
      remainingSeconds % 60;


    /*
      Show HH:MM:SS for longer sessions.
      Show MM:SS for normal sessions.
    */

    if (hours > 0) {

      return `${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(
        2,
        "0"
      )}`;

    }


    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;

  };


  /* ---------------------------------------------------------
     Session progress
     --------------------------------------------------------- */

  const getSessionProgress = () => {

    if (
      remainingSeconds === null ||
      sessionDuration === null
    ) {

      return 100;

    }


    return Math.min(
      100,
      Math.max(
        0,
        (remainingSeconds /
          sessionDuration) *
          100
      )
    );

  };


  /* ---------------------------------------------------------
     Logout
     --------------------------------------------------------- */

  const handleLogout = () => {

    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "selectedCsvDatasetId"
    );

    localStorage.removeItem(
      "selectedCsvDataset"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /* ---------------------------------------------------------
     Session timer warning
     --------------------------------------------------------- */

  const isSessionWarning =
    remainingSeconds !== null &&
    remainingSeconds <= 60;


  return (

    <div className="page-container">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="top-header">

        <div>

          <h1>
            Account{" "}

            <span className="gradient-text">
              Settings
            </span>
          </h1>

          <p>
            Manage your account and application session.
          </p>

        </div>


        {/* =================================================
            CURRENT USER
        ================================================= */}

        {currentUser && (

          <div className="settings-user-badge">

            <div className="settings-user-icon">
              👤
            </div>

            <div>

              <span>
                Welcome,
              </span>

              <strong>
                {currentUser.name}
              </strong>

            </div>

            <span className="settings-online-dot">
            </span>

          </div>

        )}

      </div>


      <div className="settings-content">


        {/* =================================================
            ACCOUNT INFORMATION
        ================================================= */}

        <div className="dashboard-card settings-card">

          <div className="card-header">

            <h2>
              Account Information
            </h2>

          </div>


          <div className="settings-account">

            <div className="settings-avatar">
              👤
            </div>


            <div className="settings-account-details">

              <h3>
                {currentUser?.name ||
                  "Authenticated User"}
              </h3>

              <p>
                {currentUser?.email ||
                  "Account email"}
              </p>

            </div>

          </div>


          <div className="settings-account-details-row">

            <div className="settings-detail-item">

              <span>
                Email
              </span>

              <strong>
                {currentUser?.email ||
                  "Not available"}
              </strong>

            </div>


            <div className="settings-detail-item">

              <span>
                Account Status
              </span>

              <strong className="account-status">
                Active
              </strong>

            </div>

          </div>

        </div>


        {/* =================================================
            SESSION MANAGEMENT
        ================================================= */}

        <div className="dashboard-card settings-card session-card">

          <div className="card-header">

            <h2>
              Session Management
            </h2>

          </div>


          <p className="session-description">
            You are currently signed in to AI CSV Analyzer.
          </p>


          {/* =================================================
              ACTIVE SESSION
          ================================================= */}

          <div className="active-session">

            <div className="active-session-indicator">

              <span className="active-session-dot">
              </span>


              <div>

                <strong>
                  Active Session
                </strong>

                <span>
                  Your session is active and secure.
                </span>

              </div>

            </div>


            <div className="session-user">

              <span>
                Logged in as
              </span>

              <strong>
                {currentUser?.name ||
                  "Authenticated User"}
              </strong>

            </div>

          </div>


          {/* =================================================
              EXPIRATION TIMER
          ================================================= */}

          <div className="session-expiration">

            <div className="session-expiration-header">

              <span>
                Session expires in
              </span>


              <strong
                className={
                  isSessionWarning
                    ? "session-timer-warning"
                    : ""
                }
              >
                {formatRemainingTime()}
              </strong>

            </div>


            <div className="session-progress-track">

              <div
                className="session-progress-bar"
                style={{
                  width: `${getSessionProgress()}%`,
                }}
              />

            </div>


            <p
              className={
                isSessionWarning
                  ? "session-expiration-note session-expiration-warning"
                  : "session-expiration-note"
              }
            >

              {isSessionWarning
                ? "Your session is about to expire. Please save your work."
                : "You'll need to sign in again when your session expires."}

            </p>

          </div>


          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >

            <span className="logout-icon">
              ↪
            </span>


            <span className="logout-text">

              <strong>
                Logout
              </strong>

              <small>
                End your current session
              </small>

            </span>

          </button>


          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <div className="security-note">

            <span>
              🛡
            </span>

            <span>
              For your security, make sure to logout
              when using a shared device.
            </span>

          </div>

        </div>

      </div>

    </div>

  );
}


/* =========================================================
   MAIN APPLICATION
   ========================================================= */

function MainApplication() {

  /* ---------------------------------------------------------
     Dataset history
     --------------------------------------------------------- */

  const [datasetHistory, setDatasetHistory] =
    useState([]);


  /* ---------------------------------------------------------
     Current selected dataset
     --------------------------------------------------------- */

  const [selectedDataset, setSelectedDataset] =
    useState(null);


  /* ---------------------------------------------------------
     Current uploaded file
     --------------------------------------------------------- */

  const [file, setFile] =
    useState(null);


  /* ---------------------------------------------------------
     Current analysis
     --------------------------------------------------------- */

  const [analysis, setAnalysis] =
    useState(null);


  /* ---------------------------------------------------------
     Status / upload message
     --------------------------------------------------------- */

  const [message, setMessage] =
    useState("");


  /* ---------------------------------------------------------
     Load dataset history from MongoDB
     --------------------------------------------------------- */

  useEffect(() => {

    const loadDatasets = async () => {

      try {

        const response =
          await fetch(
            "http://localhost:5000/api/datasets",
            {
              headers: {
                ...getAuthHeaders(),
              },
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error ||
            data.msg ||
            "Could not load datasets."
          );

        }


        const mongoDatasets =
          data

            .map((document) => ({

              id: document._id,

              fileName:
                document.file,

              fileSize:
                document.file_size ??
                null,

              fileHash:
                document.file_hash ??
                null,

              analysis:
                document,

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


  /* ---------------------------------------------------------
     Helper: save selected dataset ID
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     Analyze / load CSV
     --------------------------------------------------------- */

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

        id:
          data._id,

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
              CSV{" "}
              <span className="gradient-text">
                Analyzer
              </span>
            </h2>


            <div className="sidebar-brand-subtitle">
              Intelligent Data Analysis
            </div>

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


          <NavLink
            to="/settings"
            className="nav-item"
          >
            Settings
          </NavLink>


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
              SETTINGS
          ================================================= */}

          <Route
            path="/settings"
            element={
              <Settings />
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
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />


        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />


        {/* =================================================
            MAIN APPLICATION
        ================================================= */}

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainApplication />
            </ProtectedRoute>
          }
        />


      </Routes>

    </BrowserRouter>

  );

}


export default App;