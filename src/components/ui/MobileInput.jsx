import { TextField } from "@mui/material";

/**
 * Input ottimizzato per mobile
 * - Previene zoom su iOS (font-size >= 16px)
 * - Minimo 48px altezza
 * - Touch-friendly padding
 */
export default function MobileInput({ fullWidth = true, ...props }) {
  return (
    <TextField
      fullWidth={fullWidth}
      {...props}
      InputProps={{
        ...props.InputProps,
        sx: {
          minHeight: 48,
          fontSize: "1rem", // Previene zoom su iOS
          ...props.InputProps?.sx,
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
        },
        ...props.sx,
      }}
    />
  );
}
