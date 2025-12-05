import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/styles.css";
import { BrowserRouter } from "react-router-dom";

import { Buffer } from "buffer";
window.Buffer = Buffer;

createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);
