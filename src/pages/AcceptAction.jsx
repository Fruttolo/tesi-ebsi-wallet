export const AcceptAction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { uri, type } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const processAction = async () => {
      try {
        const res = await discoverOpenID(uri);

        if (res) {
          console.log(
            "==================================================>  Action processed successfully"
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error processing action:", error);
        setError(error.message || "Error processing action");
        setLoading(false);
      }
    };

    if (uri && type) {
      processAction();
    } else {
      console.error("Missing URI or type for action processing");
      setError("Missing URI or type for action processing");
      setLoading(false);
    }
  }, [uri, type, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {loading && (
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Processing...
          </Typography>
        </Box>
      )}
      {!loading && (
        <>
          {error ? (
            <Alert severity="error">
              <Typography variant="h6" gutterBottom>
                Error
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          ) : (
            <Alert severity="success">
              <Typography variant="h6" gutterBottom>
                Action Processed Successfully
              </Typography>
              <Typography variant="body2">The requested action has been completed.</Typography>
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};
