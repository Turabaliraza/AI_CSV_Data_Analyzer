import { useState } from "react";
import {
  MessageCircle,
  Database,
  Send,
  Sparkles,
} from "lucide-react";

function AIChatbot({ selectedDataset }) {
  const [message, setMessage] = useState("");

  const datasetName =
    selectedDataset?.fileName ||
    selectedDataset?.file ||
    selectedDataset?.filename ||
    selectedDataset?.name ||
    "No dataset selected";

  const hasDataset = Boolean(selectedDataset);

  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !hasDataset) {
      return;
    }

    // Backend chatbot integration will be added later.
    console.log("Chat message:", trimmedMessage);
    console.log("Selected dataset:", selectedDataset);

    setMessage("");
  };

  const handleSuggestion = (question) => {
    if (!hasDataset) {
      return;
    }

    setMessage(question);
  };

  return (
    <div className="page-container chatbot-page">

      {/* Header */}
      <div className="top-header chatbot-header">
        <div>
          <h1>
            AI{" "}
            <span className="gradient-text">
              Chatbot
            </span>
          </h1>

          <p>
            Ask questions about your selected dataset and get intelligent
            answers from DataPilot AI.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chatbot-workspace">

        {/* Assistant Identity */}
        <div className="chatbot-assistant">

          <div className="chatbot-assistant-icon">
            <Sparkles size={25} />
          </div>

          <h2>DataPilot AI</h2>

          <span>
            AI Data Assistant
          </span>

        </div>

        {/* Dataset Indicator */}
        <div className="chatbot-dataset-pill">

          <Database size={16} />

          <span className="dataset-pill-label">
            Dataset
          </span>

          <strong>
            {datasetName}
          </strong>

        </div>

        {/* Welcome Area */}
        <div className="chatbot-welcome">

          <h3>
            {hasDataset
              ? `Let's explore ${datasetName}`
              : "Welcome to DataPilot AI"}
          </h3>

          <p>
            {hasDataset
              ? "Ask me anything about your selected dataset. I can help you understand its structure, statistics, missing values, anomalies, and more."
              : "Select a dataset from Upload CSV first, then come here to ask questions about your data."}
          </p>

        </div>

        {/* Suggested Questions */}
        {hasDataset && (
          <div className="chatbot-suggestions">

            <button
              type="button"
              onClick={() =>
                handleSuggestion(
                  "What does this dataset contain?"
                )
              }
            >
              What does this dataset contain?
            </button>

            <button
              type="button"
              onClick={() =>
                handleSuggestion(
                  "Are there any missing values?"
                )
              }
            >
              Are there any missing values?
            </button>

            <button
              type="button"
              onClick={() =>
                handleSuggestion(
                  "Explain the detected anomalies."
                )
              }
            >
              Explain the detected anomalies.
            </button>

          </div>
        )}

        {/* Chat Input */}
        <div className="chatbot-input-wrapper">

          <div className="chatbot-input">

            <MessageCircle
              size={19}
              className="chatbot-input-icon"
            />

            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSend();
                }
              }}
              placeholder={
                hasDataset
                  ? "Ask a question about your dataset..."
                  : "Select a dataset to start chatting..."
              }
              disabled={!hasDataset}
            />

            <button
              type="button"
              className="chatbot-send-button"
              onClick={handleSend}
              disabled={!hasDataset || !message.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>

          </div>

          <span className="chatbot-input-note">
            DataPilot AI can answer questions based on your selected dataset.
          </span>

        </div>

      </div>
    </div>
  );
}

export default AIChatbot;