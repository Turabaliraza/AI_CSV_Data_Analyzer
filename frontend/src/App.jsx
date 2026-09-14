import { useState }from "react";
import "./App.css";

function App(){
  const[file, setFile]=useState(null);
  const[message,setMessage]=useState("");

  const handleFileChange = (event)=>{
    setFile(event.target.files[0]);
  };

  const handleUpload=()=>{
    if(!file){
      setMessage("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file",file);

    fetch("http://127.0.0.1:5000/api/upload",{
      method:"POST",
      body:formData,
    })
      .then((response)=>response.json())
      .then((data)=>{
        if(data.error){
          setMessage(data.error);
        }
        else{
          setMessage(`${data.message}File:${data.file}`);
        }
      })
      .catch((error)=>{
        console.error("Upload error:",error);
        setMessage("Error connceting to Flask.");
      });
  };

  return (
    <div>
      <h1>AI CSV Data Analyzer</h1>

      <input 
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />

      <button onClick={handleUpload}>
        Upload CSV
      </button>
      <p>{message}</p>
    </div>
  );
}
export default App;