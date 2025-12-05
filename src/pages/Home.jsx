import { useState } from "react";
import { generateDid, getDid } from "../utils/Utils";
import { Button, Grid, TextField, Typography } from "@mui/material";

export default function Home() {
	const [message, setMessage] = useState("");

	const [mnemonic, setMnemonic] = useState("");
	const [mnemonicInput, setMnemonicInput] = useState("");

	const [did, setDid] = useState("");

	const [historyDid, setHistoryDid] = useState([]);

	return (
		<Grid className="app-root">
			<Grid>
				<Typography variant="h3">DID Ebsi</Typography>
			</Grid>

			<Grid className="card">
				<Button
					variant="contained"
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
				</Button>
				<Button
					variant="contained"
					style={{ marginLeft: "10px" }}
					onClick={() => {
						setMessage("");
						setMnemonic("");
						setDid("");
						setMnemonicInput("");
					}}
				>
					Clear
				</Button>
				<Grid
					style={{
						marginTop: "20px",
						padding: "10px",
						borderRadius: "5px",
						wordBreak: "break-all",
					}}
				>
					Message: {message} <br /> <br />
					Mnemonic: {mnemonic} <br /> <br />
					Did: {did}
				</Grid>
				<br /> <br />
				<Grid>
					<TextField
						type="text"
						placeholder="Enter your mnemonic here"
						value={mnemonicInput}
						onChange={(e) => setMnemonicInput(e.target.value)}
						sx={{ width: "60%" }}
					/>
					<Button
						variant="contained"
						style={{ marginLeft: "10px" }}
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
					</Button>
				</Grid>
				<br /> <br />
				<Typography variant="h6"> History DID </Typography>
				<Grid
					id="card"
					style={{
						marginTop: "20px",
						padding: "10px",
						borderRadius: "5px",
						wordBreak: "break-all",
					}}
				>
					{/* Elenco dei DID generati in precedenza dal piu recente al meno recente */}
					{[...historyDid].reverse().map((item, index) => (
						<Grid key={index} style={{ marginBottom: "10px" }}>
							{item}
						</Grid>
					))}
				</Grid>
			</Grid>
		</Grid>
	);
}
