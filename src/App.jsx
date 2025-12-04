import { useState } from 'react'
import { generateDid, getDid } from "./utils/Utils";

export default function App() {

  const [message, setMessage] = useState("");

  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicInput, setMnemonicInput] = useState("");

  const [did, setDid] = useState("");

  const [historyDid, setHistoryDid] = useState([]);

  return (
    <div className="app-root">
      <header>
        <h1>DID Ebsi</h1>
      </header>

      <main>
        <div className="card">

          <button
            onClick={async () => {
              await generateDid().then((res) => {
                setMessage("Generated new DID");
                setMnemonic(res); 
                getDid().then((didRes) => {
                  setDid(didRes);
                  setHistoryDid((prevHistory) => [...prevHistory, didRes]);
                });
              });
            }}
          >
            Generate New DID
          </button>

          <button
            style={{marginLeft: "10px"}}
            onClick={() => {
              setMessage("");
              setMnemonic("");
              setDid("");
            }}
          >
            Clear
          </button>

          <p
            style={{
              marginTop: "20px", 
              padding: "10px",  
              borderRadius: "5px", 
              wordBreak: "break-all"
            }}
          >
            Message: {message}  <br /> <br />
            Mnemonic: {mnemonic} <br /> <br />
            Did: {did}
          </p>

          <br /> <br /> 

          <input type="text" 
            placeholder="Enter your mnemonic here"
            value={ mnemonicInput }
            onChange={(e) => setMnemonicInput(e.target.value)}
            style={{width: "60%"}}
          />
          <button
            style={{marginLeft: "10px"}}
            onClick={() => {
              generateDid(mnemonicInput).then((res) => {
                setMessage("Restored DID");
                setMnemonic(res); 
                getDid().then((didRes) => {
                  setDid(didRes);
                  setHistoryDid((prevHistory) => [...prevHistory, didRes]);
                });
              });
            }}
          >
            Restore DID
          </button>

          <br /> <br /> 

          <h3> History DID </h3>
          <div id="card"
            style={{
              marginTop: "20px", 
              padding: "10px",  
              borderRadius: "5px", 
              wordBreak: "break-all"
            }}
          >
            {/* Elenco dei DID generati in precedenza */}
            {historyDid.map((item, index) => (
              <div key={index} style={{marginBottom: "10px"}}>
                {item}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
