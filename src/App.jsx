import React from 'react'

export default function App() {
  return (
    <div className="app-root">
      <header>
        <h1>Capacitor + React (JSX) — Hello World 👋</h1>
      </header>

      <main>
        <p>
          This is a minimal React app scaffolded for Capacitor. Build it and
          connect with Capacitor to make native mobile apps.
        </p>

        <div className="card">
          <button
            onClick={() => {
              alert('Hello from Capacitor + React!')
            }}
          >
            Say Hello
          </button>
        </div>
      </main>

      <footer>
        <small>Built with Vite + React + Capacitor</small>
      </footer>
    </div>
  )
}
