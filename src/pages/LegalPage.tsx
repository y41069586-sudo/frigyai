import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LegalDocumentView } from "@/components/LegalDocumentView";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalDocument, getLegalUiCopy } from "@/lib/legalContent";

const LegalPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const ui = getLegalUiCopy(language);
  const document = getLegalDocument(type, language);
  const from = (location.state as { from?: string } | null)?.from;

  const handleClose = () => {
    if (from && typeof from === "string" && from.startsWith("/")) {
      navigate(from, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
            aria-label={ui.backAria}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold truncate flex-1">
            {document?.pageTitle ?? ui.notFound}
          </h1>
          <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={handleClose} type="button">
            {ui.close}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-3xl mx-auto p-4 pb-20">
          {document ? (
            <LegalDocumentView document={document} />
          ) : (
            <p className="text-muted-foreground text-sm sm:text-base">{ui.notFound}</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LegalPage;
