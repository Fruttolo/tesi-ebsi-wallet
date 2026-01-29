import { Box, Typography, Container } from "@mui/material";

/**
 * Componente base per pagine mobile-optimized
 * Gestisce padding, safe areas e layout responsive
 */
export default function PageBase({
  title,
  subtitle,
  children,
  maxWidth = "sm",
  noPadding = false,
}) {
  return (
    <Box
      sx={{
        minHeight: "100%",
        pt: noPadding ? 0 : 2,
        pb: noPadding ? 0 : 2,
      }}
    >
      <Container
        maxWidth={maxWidth}
        sx={{
          px: noPadding ? 0 : 2,
        }}
      >
        {/* Header della pagina */}
        {title && (
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: subtitle ? 1 : 0,
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {/* Contenuto della pagina */}
        {children}
      </Container>
    </Box>
  );
}
