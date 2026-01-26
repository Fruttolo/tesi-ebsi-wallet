import { useState } from "react";
import { generateDid, getDid } from "../utils/Utils";
import { Button, Grid, TextField, Typography } from "@mui/material";
import PageBase from "../components/PageBase";

export default function Home() {
	const [message, setMessage] = useState("");

	const [mnemonic, setMnemonic] = useState("");
	const [mnemonicInput, setMnemonicInput] = useState("");

	const [did, setDid] = useState("");

	const [historyDid, setHistoryDid] = useState([]);

	return (
		<PageBase title="DID Ebsi Home">
			<Grid container direction="column" sx={{ padding: "10px" }}>
				<Grid item xs={12} sx={{ marginBottom: "10px" }}>
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
				</Grid>
				<Grid
					item
					xs={12}
					style={{
						marginBottom: "10px",
						wordBreak: "break-all",
					}}
				>
					Message: {message} <br /> <br />
					Mnemonic: {mnemonic} <br /> <br />
					Did: {did}
				</Grid>
				<Grid item xs={12} sx={{ alignItems: "center", marginBottom: "20px" }}>
					<TextField
						type="text"
						placeholder="Enter your mnemonic here"
						value={mnemonicInput}
						onChange={(e) => setMnemonicInput(e.target.value)}
					/>
					<Button
						variant="contained"
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
				<Grid item xs={12} sx={{ alignItems: "center", marginBottom: "10px" }}>
					<Typography variant="h7"> History DID </Typography>
					<Grid
						style={{
							marginTop: "20px",
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
		</PageBase>
	);
}
