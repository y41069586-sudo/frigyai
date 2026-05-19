import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/** Legacy route: leitet sofort weiter (kein „Überprüfe deine E-Mail“-Screen mehr). */
const EmailConfirmationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const goNext = () => {
      const explicit = searchParams.get("next");
      const target = explicit && explicit.startsWith("/") ? explicit : "/premium-pricing";
      navigate(target, { replace: true });
    };

    void supabase.auth.getSession().finally(goNext);
  }, [navigate, searchParams]);

  return null;
};

export default EmailConfirmationPage;
