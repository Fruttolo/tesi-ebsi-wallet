import { util } from "@cef-ebsi/ebsi-did-resolver";
import React, { useEffect, useState } from 'react'

export default function App() {

  const [did, setDid] = useState("");

  function generateDid() {
    // create an array of 16 random bytes with react
    const subjectIdentifierBytes = new Uint8Array(16);
    window.crypto.getRandomValues(subjectIdentifierBytes);

    const did = util.createDid(subjectIdentifierBytes);
    setDid(did);
  }

  return (
    <div className="app-root">
      <header>
        <h1>DID Ebsi</h1>
      </header>

      <main>
        <p>
          {`Your generated DID is: ${did}`}
        </p>

        <div className="card">
          <button
            onClick={() => {
              generateDid();
            }}
          >
            Generate New DID
          </button>
        </div>
      </main>
    </div>
  )
}
