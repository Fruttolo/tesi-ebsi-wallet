import { Card } from "@mui/material";

/**
 * Card ottimizzata per touch con feedback visivo
 * - Border e shadow ottimizzati per mobile
 * - Feedback su press
 * - Gradient background
 */
export default function TouchCard({ children, onClick, gradient = false, ...props }) {
  return (
    <Card
      onClick={onClick}
      {...props}
      sx={{
        background: gradient
          ? "linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)"
          : "background.paper",
        border: gradient ? "1px solid rgba(96, 165, 250, 0.2)" : "none",
        borderRadius: 4,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        ...(onClick && {
          touchAction: "manipulation",
          "&:active": {
            transform: "scale(0.98)",
          },
        }),
        ...props.sx,
      }}
    >
      {children}
    </Card>
  );
}
