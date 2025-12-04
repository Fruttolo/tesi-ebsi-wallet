import { useState } from 'react'
import { generateDid, getDid } from "./utils/Utils";

export default function App() {

  const [message, setMessage] = useState("");

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
                setMessage(res);
              });
            }}
          >
            Generate New DID
          </button>

          <button
            style={{marginLeft: "10px"}}
            onClick={() => {
              getDid().then((did) => {
                setMessage(did);
              });
            }}
          >
            Get DID
          </button>

          <p
            style={{
              marginTop: "20px", 
              padding: "10px",  
              borderRadius: "5px", 
              wordBreak: "break-all"
            }}
          >
            {message}
          </p>

        </div>
      </main>
    </div>
  )
}
