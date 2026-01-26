import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SettingsIcon from "@mui/icons-material/Settings";

/**
 * Layout mobile con bottom navigation
 * Ottimizzato per touch interaction e safe areas
 */
export default function MobileLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determina la tab attiva basandosi sul path corrente
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === "/home") return 0;
    if (path === "/credentials") return 1;
    if (path === "/scan-qr") return 2;
    if (path === "/settings") return 3;
    return 0;
  };

  const [value, setValue] = useState(getCurrentTab());

  const handleNavigation = (event, newValue) => {
    setValue(newValue);
    const routes = ["/home", "/credentials", "/scan-qr", "/settings"];
    navigate(routes[newValue]);
  };

  // Nascondi bottom nav su pagine di setup/onboarding
  const hideBottomNav =
    location.pathname.includes("onboarding") ||
    location.pathname.includes("wallet-choice") ||
    location.pathname.includes("wallet-setup") ||
    location.pathname.includes("import-wallet");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Contenuto principale scrollabile */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          pb: hideBottomNav ? 2 : "88px", // Padding per bottom nav
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation - touch friendly */}
      {!hideBottomNav && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            pb: "env(safe-area-inset-bottom)",
          }}
          elevation={8}
        >
          <BottomNavigation
            value={value}
            onChange={handleNavigation}
            showLabels
            sx={{
              height: 72,
              "& .MuiBottomNavigationAction-root": {
                minWidth: "auto",
                padding: "8px 12px",
                // Touch target ottimizzato
                "&:active": {
                  transform: "scale(0.95)",
                },
              },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.75rem",
                marginTop: "4px",
              },
            }}
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Credenziali" icon={<VerifiedUserIcon />} />
            <BottomNavigationAction label="Scansiona" icon={<QrCodeScannerIcon />} />
            <BottomNavigationAction label="Impostazioni" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
