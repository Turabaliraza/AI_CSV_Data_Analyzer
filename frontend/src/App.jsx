import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Upload as UploadIcon,
  BarChart3,
  PieChart,
  LineChart,
  Brain,
  TriangleAlert,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Plus,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Settings as SettingsIcon,
} from "lucide-react";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Overview from "./pages/Overview";
import AIChatbot from "./pages/AIChatbot";
import Statistics from "./pages/Statistics";
import Visualizations from "./pages/Visualizations";
import AIAnalysis from "./pages/AIAnalysis";
import Anomalies from "./pages/Anomalies";

import "./App.css";


const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function AuthRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


function Settings() {
  const navigate = useNavigate();

  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(null);


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


    calculateRemainingTime();


    const timer =
      setInterval(
        calculateRemainingTime,
        1000
      );


    return () =>
      clearInterval(timer);

  }, [navigate]);


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


  const isSessionWarning =
    remainingSeconds !== null &&
    remainingSeconds <= 60;


  return (

    <div className="page-container">

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


        <div className="dashboard-card settings-card session-card">

          <div className="card-header">

            <h2>
              Session Management
            </h2>

          </div>


          <p className="session-description">
            You are currently signed in to AI CSV Analyzer.
          </p>


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


function MainApplication() {

  const [datasetHistory, setDatasetHistory] =
    useState([]);


  const [selectedDataset, setSelectedDataset] =
    useState(null);


  const [file, setFile] =
    useState(null);


  const [analysis, setAnalysis] =
    useState(null);


  const [message, setMessage] =
    useState("");


  const [chatHistory, setChatHistory] =
    useState([]);

  const [isChatHistoryOpen, setIsChatHistoryOpen] =
    useState(false);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [newChatKey, setNewChatKey] =
    useState(0);

  const [chatMenuId, setChatMenuId] =
    useState(null);

  const [editingChatId, setEditingChatId] =
    useState(null);

  const [editingChatTitle, setEditingChatTitle] =
    useState("");


  const loadChatHistory = async () => {

    try {

      const response = await fetch(
        "http://localhost:5000/api/chats",
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
          "Could not load chat history."
        );
      }

      setChatHistory(
        Array.isArray(data) ? data : []
      );

    } catch (error) {

      console.error(
        "Could not load AI chat history:",
        error
      );

    }
  };


  const handleNewChat = () => {

    setChatMenuId(null);
    handleCancelRename();

    setActiveChatId(null);
    setNewChatKey((value) => value + 1);

    navigate(
      "/ai-chatbot",
      {
        replace: false,
      }
    );

  };


  const handleOpenChat = (chat) => {

    setChatMenuId(null);
    handleCancelRename();

    const chatDataset = datasetHistory.find(
      (dataset) =>
        String(dataset.id) ===
        String(chat.dataset_id)
    );

    if (chatDataset) {
      saveSelectedDataset(chatDataset);
      setAnalysis(chatDataset.analysis);
    }

    setActiveChatId(chat.id);

    navigate(
      "/ai-chatbot",
      {
        replace: false,
      }
    );

  };


  const handleChatCreated = () => {
    loadChatHistory();
  };


  const handleStartRename = (chat) => {
    setChatMenuId(null);
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title || "");
  };


  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditingChatTitle("");
  };


  const handleRenameChat = async (chatId) => {
    const trimmedTitle = editingChatTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/chats/${chatId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            title: trimmedTitle,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.msg ||
          "Could not rename the chat."
        );
      }

      setChatHistory((previousHistory) =>
        previousHistory.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title:
                  data.chat?.title ||
                  trimmedTitle,
                updated_at:
                  data.chat?.updated_at ||
                  chat.updated_at,
              }
            : chat
        )
      );

      handleCancelRename();

    } catch (error) {

      console.error(
        "Could not rename AI chat:",
        error
      );

      window.alert(
        error.message ||
        "Could not rename the chat."
      );

    }
  };


  const handleDeleteChat = async (chat) => {

    setChatMenuId(null);

    const confirmed = window.confirm(
      `Delete "${chat.title}"? This conversation will be permanently deleted.`
    );

    if (!confirmed) {
      return;
    }

    try {

      const response = await fetch(
        `http://localhost:5000/api/chats/${chat.id}`,
        {
          method: "DELETE",
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
          "Could not delete the chat."
        );
      }

      setChatHistory((previousHistory) =>
        previousHistory.filter(
          (item) => item.id !== chat.id
        )
      );

      if (activeChatId === chat.id) {

        setActiveChatId(null);
        setNewChatKey((value) => value + 1);

        navigate(
          "/ai-chatbot",
          {
            replace: false,
          }
        );

      }

    } catch (error) {

      console.error(
        "Could not delete AI chat:",
        error
      );

      window.alert(
        error.message ||
        "Could not delete the chat."
      );

    }
  };


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


        localStorage.removeItem(
          "csvAnalysisHistory"
        );


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


  const handleUpload = async () => {

    if (!file) {

      setMessage(
        "Please select a CSV file first."
      );

      return;

    }


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


  return (

    <div className="app">


      <aside className="sidebar">


        <div className="sidebar-brand">

          <div className="brand-icon">
            AI
          </div>

          <div>

            <h2>
              Data{" "}
              <span className="gradient-text">
                Pilot AI
              </span>
            </h2>

          </div>

        </div>


        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className="nav-item"
          >
            <LayoutDashboard className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>


          <NavLink
            to="/upload"
            className="nav-item"
          >
            <UploadIcon className="nav-icon" />
            <span>Upload CSV</span>
          </NavLink>


          <div className="chatbot-nav-wrapper">

            <div className="chatbot-nav-row">

              <NavLink
                to="/ai-chatbot"
                className="nav-item chatbot-nav-link"
                onClick={handleNewChat}
              >
                <MessageCircle className="nav-icon" />
                <span>AI Chatbot</span>
              </NavLink>


              <button
                type="button"
                className="chat-history-toggle"
                onClick={() => {

                  const nextState =
                    !isChatHistoryOpen;

                  setIsChatHistoryOpen(
                    nextState
                  );

                  if (nextState) {
                    loadChatHistory();
                  }

                }}
                aria-label={
                  isChatHistoryOpen
                    ? "Collapse chat history"
                    : "Expand chat history"
                }
                title={
                  isChatHistoryOpen
                    ? "Hide chat history"
                    : "Show chat history"
                }
              >

                {isChatHistoryOpen ? (

                  <ChevronDown size={16} />

                ) : (

                  <ChevronRight size={16} />

                )}

              </button>

            </div>


            {isChatHistoryOpen && (

              <div className="chat-history-panel">


                <button
                  type="button"
                  className="chat-history-new"
                  onClick={handleNewChat}
                >
                  <Plus size={15} />
                  <span>New Chat</span>
                </button>


                {chatHistory.length === 0 ? (

                  <div className="chat-history-empty">

                    <MessageSquare size={15} />

                    <span>
                      No saved chats yet.
                    </span>

                  </div>

                ) : (

                  <div className="chat-history-list">

                    {chatHistory.map((chat) => (

                      <div
                        key={chat.id}
                        className={`chat-history-row ${
                          activeChatId === chat.id
                            ? "chat-history-row-active"
                            : ""
                        } ${
                          chatMenuId === chat.id
                            ? "chat-history-row-menu-open"
                            : ""
                        }`}
                      >

                        <>

                          <button
                            type="button"
                            className={`chat-history-item ${
                              activeChatId === chat.id
                                ? "chat-history-item-active"
                                : ""
                            }`}
                            onClick={() =>
                              handleOpenChat(chat)
                            }
                            title={chat.title}
                          >

                            <MessageSquare size={14} />

                            <span>
                              {chat.title}
                            </span>

                          </button>


                          <div className="chat-history-menu-wrapper">

                            <button
                              type="button"
                              className="chat-history-menu-button"
                              onClick={(event) => {

                                event.stopPropagation();

                                setChatMenuId(
                                  (currentId) =>
                                    currentId === chat.id
                                      ? null
                                      : chat.id
                                );

                              }}
                              aria-label={`Options for ${chat.title}`}
                              title="Chat options"
                            >

                              <MoreVertical size={15} />

                            </button>


                            {chatMenuId === chat.id && (

                              <div
                                className="chat-history-menu"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartRename(
                                      chat
                                    )
                                  }
                                >

                                  <Pencil size={14} />

                                  <span>
                                    Rename
                                  </span>

                                </button>


                                <button
                                  type="button"
                                  className="chat-history-delete"
                                  onClick={() =>
                                    handleDeleteChat(
                                      chat
                                    )
                                  }
                                >

                                  <Trash2 size={14} />

                                  <span>
                                    Delete
                                  </span>

                                </button>

                              </div>

                            )}

                          </div>

                        </>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}

          </div>


          <NavLink
            to="/overview"
            className="nav-item"
          >
            <BarChart3 className="nav-icon" />
            <span>Overview</span>
          </NavLink>


          <NavLink
            to="/statistics"
            className="nav-item"
          >
            <PieChart className="nav-icon" />
            <span>Statistics</span>
          </NavLink>


          <NavLink
            to="/visualizations"
            className="nav-item"
          >
            <LineChart className="nav-icon" />
            <span>Visualizations</span>
          </NavLink>


          <NavLink
            to="/ai-analysis"
            className="nav-item"
          >
            <Brain className="nav-icon" />
            <span>AI Analysis</span>
          </NavLink>


          <NavLink
            to="/anomalies"
            className="nav-item"
          >
            <TriangleAlert className="nav-icon" />
            <span>Anomalies</span>
          </NavLink>


          <NavLink
            to="/settings"
            className="nav-item"
          >
            <SettingsIcon className="nav-icon" />
            <span>Settings</span>
          </NavLink>

        </nav>


        <div className="sidebar-footer">

          <span className="sidebar-tagline">
            AI-Powered Data Analysis
          </span>

        </div>


      </aside>


      <main className="main-content">


        <Routes>


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


          <Route
            path="/ai-chatbot"
            element={

              <ProtectedRoute>

                <AIChatbot

                  selectedDataset={
                    selectedDataset
                  }

                  activeChatId={
                    activeChatId
                  }

                  newChatKey={
                    newChatKey
                  }

                  onChatCreated={
                    handleChatCreated
                  }

                />

              </ProtectedRoute>

            }
          />


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


          <Route
            path="/settings"
            element={
              <Settings />
            }
          />


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


        {editingChatId && (

          <div
            className="chat-rename-modal-overlay"
            role="presentation"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                handleCancelRename();

              }

            }}
          >

            <div
              className="chat-rename-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-rename-modal-title"
            >


              <div className="chat-rename-modal-header">

                <div>

                  <h2 id="chat-rename-modal-title">
                    Rename Chat
                  </h2>

                  <p>
                    Choose a new name for this conversation.
                  </p>

                </div>


                <button
                  type="button"
                  className="chat-rename-modal-close"
                  onClick={handleCancelRename}
                  aria-label="Close rename dialog"
                  title="Close"
                >

                  <X size={18} />

                </button>

              </div>


              <div className="chat-rename-modal-body">

                <label htmlFor="chat-rename-input">
                  Chat name
                </label>


                <input
                  id="chat-rename-input"
                  type="text"
                  value={editingChatTitle}
                  onChange={(event) =>
                    setEditingChatTitle(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key === "Enter"
                    ) {

                      const trimmedTitle =
                        editingChatTitle.trim();

                      if (trimmedTitle) {

                        handleRenameChat(
                          editingChatId
                        );

                      }

                    }


                    if (
                      event.key === "Escape"
                    ) {

                      handleCancelRename();

                    }

                  }}
                  maxLength={100}
                  autoFocus
                />


                <span className="chat-rename-modal-counter">
                  {editingChatTitle.length}/100
                </span>

              </div>


              <div className="chat-rename-modal-footer">

                <button
                  type="button"
                  className="chat-rename-cancel-button"
                  onClick={handleCancelRename}
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="chat-rename-save-button"
                  onClick={() => {

                    const trimmedTitle =
                      editingChatTitle.trim();

                    if (trimmedTitle) {

                      handleRenameChat(
                        editingChatId
                      );

                    }

                  }}
                  disabled={
                    !editingChatTitle.trim()
                  }
                >
                  Save
                </button>

              </div>

            </div>

          </div>

        )}


      </main>


    </div>

  );

}


function App() {

  return (

    <BrowserRouter>

      <Routes>


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