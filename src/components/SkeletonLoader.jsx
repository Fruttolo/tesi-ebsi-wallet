import { Card, CardContent, Skeleton, Stack } from "@mui/material";

/**
 * Skeleton loader per una singola credenziale
 * @returns {JSX.Element}
 */
export function CredentialSkeleton() {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="rectangular" height={100} />
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader per una lista di elementi
 * @param {Object} props
 * @param {number} props.items - Numero di skeleton da visualizzare
 * @returns {JSX.Element}
 */
export function ListSkeleton({ items = 3 }) {
  return (
    <Stack spacing={2} role="status" aria-label="Caricamento contenuto">
      {Array.from({ length: items }).map((_, i) => (
        <CredentialSkeleton key={i} />
      ))}
    </Stack>
  );
}
