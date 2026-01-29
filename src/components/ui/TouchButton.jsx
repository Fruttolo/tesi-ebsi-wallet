import { Button } from "@mui/material";

/**
 * Button ottimizzato per touch interaction
 * - Minimo 48x48px touch target
 * - Feedback visivo su press
 * - Previene doppio tap zoom
 */
export default function TouchButton({ children, fullWidth = false, size = "large", ...props }) {
  return (
    <Button
      fullWidth={fullWidth}
      size={size}
      {...props}
      sx={{
        minHeight: 48,
        py: 1.5,
        px: 3,
        borderRadius: 3,
        touchAction: "manipulation",
        transition: "all 0.2s ease",
        "&:active": {
          transform: "scale(0.97)",
        },
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
}
