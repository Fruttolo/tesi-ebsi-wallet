import { useLocation, useNavigate } from "react-router-dom";

export const CredentialOffer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const url = location.state?.url;
    const pin = location.state?.pin;

    if (!url) {
      console.error("No URL provided in state");
      navigate("/", { replace: true });
      return;
    }

    if (pin) {
      // Authorized credential offer flow
      const res = authorizeCredentialOffer(url);
    } else {
      // Pre-authorized credential offer flow
    }
  }, []);

  return <></>;
};
