import { useState } from "react";
import {
  MessageCircle,
  Database,
  Send,
  Sparkles,
} from "lucide-react";

function AIChatbot({ selectedDataset }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const datasetName =
    selectedDataset?.fileName ||
    selectedDataset?.file ||
    selectedDataset?.filename ||
    selectedDataset?.name ||
    "No dataset selected";

  const hasDataset = Boolean(
    selectedDataset?.id
  );

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      !hasDataset ||
      loading
    ) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setMessage("");
    setLoading(true);

    try {
      const token =
        localStorage.getItem(
          "accessToken"
        );

      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            dataset_id:
              selectedDataset.id,

            message:
              trimmedMessage,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not get an AI response."
        );
      }

      setMessages((previous) => [
        ...previous,

        {
          role: "assistant",
          content:
            data.message,
        },
      ]);

    } catch (error) {
      console.error(
        "Chat request failed:",
        error
      );

      setMessages((previous) => [
        ...previous,

        {
          role: "assistant",
          content:
            error.message ||
            "Something went wrong while contacting DataPilot AI.",
          isError: true,
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (question) => {
    if (!hasDataset || loading) {
      return;
    }

    setMessage(question);
  };

  return (
    <div className="page-container chatbot-page">

      <div className="top-header chatbot-header">
        <div>

          <h1>
            AI{" "}
            <span className="gradient-text">
              Chatbot
            </span>
          </h1>

          <p>
            Ask questions about your selected
            dataset and get intelligent answers
            from DataPilot AI.
          </p>

        </div>
      </div>


      <div className="chatbot-workspace">

        {/* =================================================
            ASSISTANT HEADER
        ================================================= */}

        <div className="chatbot-assistant">

          <div className="chatbot-assistant-icon">
            <Sparkles size={25} />
          </div>

          <h2>
            DataPilot AI
          </h2>

          <span>
            AI Data Assistant
          </span>

        </div>


        {/* =================================================
            DATASET
        ================================================= */}

        <div className="chatbot-dataset-pill">

          <Database size={16} />

          <span className="dataset-pill-label">
            Dataset
          </span>

          <strong>
            {datasetName}
          </strong>

        </div>


        {/* =================================================
            CHAT CONTENT
        ================================================= */}

        {messages.length === 0 ? (

          <>
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

          </>

        ) : (

          <div className="chatbot-messages">

            {messages.map(
              (chatMessage, index) => (

                <div
                  key={index}
                  className={`chat-message ${
                    chatMessage.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >

                  <div className="chat-message-icon">

                    {chatMessage.role ===
                    "user" ? (
                      <MessageCircle
                        size={16}
                      />
                    ) : (
                      <Sparkles
                        size={16}
                      />
                    )}

                  </div>

                  <div
                    className={
                      chatMessage.isError
                        ? "chat-message-content chat-error"
                        : "chat-message-content"
                    }
                  >
                    {chatMessage.content}
                  </div>

                </div>

              )
            )}

            {loading && (

              <div className="chat-message assistant-message">

                <div className="chat-message-icon">
                  <Sparkles size={16} />
                </div>

                <div className="chat-message-content">
                  DataPilot AI is thinking...
                </div>

              </div>

            )}

          </div>

        )}


        {/* =================================================
            INPUT
        ================================================= */}

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
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={(event) => {

                if (
                  event.key === "Enter"
                ) {
                  handleSend();
                }

              }}
              placeholder={
                hasDataset
                  ? "Ask a question about your dataset..."
                  : "Select a dataset to start chatting..."
              }
              disabled={
                !hasDataset ||
                loading
              }
            />

            <button
              type="button"
              className="chatbot-send-button"
              onClick={handleSend}
              disabled={
                !hasDataset ||
                !message.trim() ||
                loading
              }
              aria-label="Send message"
            >
              <Send size={18} />
            </button>

          </div>

          <span className="chatbot-input-note">
            DataPilot AI answers questions using
            your selected dataset.
          </span>

        </div>

      </div>

    </div>
  );
}

export default AIChatbot;