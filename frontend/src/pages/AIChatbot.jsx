import { useMemo } from "react";
import { MessageCircle, Database} from "lucide-react";

function AIChatbot(){

    const selectionDataset=useMemo(()=>{
        const storedDataset=localStorage.getItem("selectedCsvDataset");

        if(!storedDataset){
            return null;
        }
        try{
            return JSON.parse(storedDataset);
        }
        catch{
            return null;
        }
    },[]);
    const datasetName=selectedDataset?.file || selectedDataset?.filename;

    return(
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
                        Ask questions about your selected dataset and get intelligent 
                        answers from DataPilot AI.
                    </p>
                </div>
            </div>
            <div className="chatbot-container">
                <div className="chatbot-topbar">
                    <div className="chatbot-title">
                        <div className="chatbot-icon">
                            <MessageCircle size={20}/>
                        </div>
                        <div>
                            <h2>DataPilot AI</h2>
                            <span>AI Data Assitant</span>
                        </div>
                    </div>

                    <div className="chatbot-dataset">
                        <Database size={16}/>

                        <div>
                            <span className="chatbot-dataset-label">
                                Selected Dataset 
                            </span>
                            <strong>
                                {datasetName || "No dataset selected"}
                            </strong>
                        </div>
                    </div>
                </div>
                    <div className="chatbot-messages">
                        <div className="chatbot-welcome">
                            <div className="chatbot-welcome-icon">
                                <MessageCircle size={28}/>
                            </div>
                            <h2>
                                {datasetName
                                  ? `Let's explore ${datasetName}`
                                  : "Welcome to DataPilot AI"
                                }
                            </h2>

                            <p>
                                {datasetName
                                   ? "Ask me questions about your selected dataset.I can help you understand its structure,statistics,missing values,anomalies,and more."
                                   : "Select a dataset first, then come here to ask questions about your data."
                                }
                            </p>

                            {datasetName && (
                                <div className="chatbot-suggestions">
                                    <button>
                                        What does this dataset contian?
                                    </button>

                                    <button>
                                        Are there any missing values?
                                    </button>

                                    <button>
                                        Explain the detected anomalies.
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chatbot-input-area">
                        <input 
                          type="text"
                          placeholder={
                            datasetName
                            ?"Ask a question about your dataset..."
                            :"Select a dataset to start chatting..."
                          }
                          disabled={!datasetName}
                          />
                          <button 
                            type="button"
                            disabled={!datasetName}
                            className="chatbot-send-button"
                            >
                              <MessageCircle size={19} />  
                            </button>
                    </div>
            </div>
        </div>
    );
}
export default AIChatbot;