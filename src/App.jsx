import React, { useEffect, useState } from 'react'
import { generateDid, getDid } from "./utils/Utils";

export default function App() {

  const [message, setMessage] = useState("");

  return (
    <div className="app-root">
      <header>
        <h1>DID Ebsi</h1>
      </header>
      <p>
        {message}
      </p>

      <main>
        <div className="card">
          <button
            onClick={() => {
              generateDid();
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

        </div>
      </main>
    </div>
  )
}
