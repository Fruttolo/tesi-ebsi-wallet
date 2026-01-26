import { useState } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Divider,
  Chip,
} from "@mui/material";

/**
 * Componente per selezionare attributi da rivelare in selective disclosure
 * @param {Object} props
 * @param {Object} props.credential - Credenziale con attributi
 * @param {Array<string>} props.selectedAttributes - Attributi selezionati
 * @param {Function} props.onSelectionChange - Callback quando selezione cambia
 */
export default function AttributeSelector({
  credential,
  selectedAttributes = [],
  onSelectionChange,
}) {
  const [attributes, setAttributes] = useState(() => {
    // Estrai attributi da credenziale
    return Object.keys(credential.credentialSubject || {})
      .filter((k) => k !== "id")
      .map((key) => ({
        key,
        value: credential.credentialSubject[key],
        label: formatAttributeName(key),
      }));
  });

  const handleAttributeToggle = (attrKey) => {
    const newSelection = selectedAttributes.includes(attrKey)
      ? selectedAttributes.filter((k) => k !== attrKey)
      : [...selectedAttributes, attrKey];

    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const formatAttributeName = (key) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

  const formatValue = (value) => {
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Attributi Disponibili</Typography>
        <Chip
          label={`${selectedAttributes.length} / ${attributes.length} selezionati`}
          color={selectedAttributes.length > 0 ? "primary" : "default"}
          size="small"
        />
      </Box>
      <Divider sx={{ mb: 2 }} />

      <FormGroup>
        {attributes.map((attr) => (
          <Box
            key={attr.key}
            sx={{
              mb: 2,
              p: 2,
              border: "1px solid",
              borderColor: selectedAttributes.includes(attr.key) ? "primary.main" : "grey.300",
              borderRadius: 1,
              bgcolor: selectedAttributes.includes(attr.key) ? "primary.light" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedAttributes.includes(attr.key)}
                  onChange={() => handleAttributeToggle(attr.key)}
                />
              }
              label={
                <Typography variant="body1" fontWeight="bold">
                  {attr.label}
                </Typography>
              }
            />
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                ml: 4,
                mt: 1,
                p: 1,
                bgcolor: "grey.100",
                borderRadius: 1,
                fontFamily: "monospace",
              }}
            >
              {formatValue(attr.value)}
            </Typography>
          </Box>
        ))}
      </FormGroup>

      {attributes.length === 0 && (
        <Typography variant="body2" color="textSecondary" align="center">
          Nessun attributo disponibile
        </Typography>
      )}
    </Paper>
  );
}
