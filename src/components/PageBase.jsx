import { Grid, Typography } from "@mui/material";

export default function PageBase(props) {
	return (
		<Grid
			container
			direction="column"
			sx={{
				width: "95%",
				backgroundColor: "rgba(255, 255, 255, 0.02)",
				marginTop: "10px",
			}}
		>
			{props.title && (
				<Grid item xs={12}>
					<Typography sx={{ marginLeft: "10px" }} variant="h6">
						{props.title}
					</Typography>
				</Grid>
			)}
			<Grid item xs={12}>
				{props.children}
			</Grid>
		</Grid>
	);
}
