import type { LegalBlock, LegalDocument } from "@/lib/legalContent";
import { LEGAL_EMAIL } from "@/lib/legalContent";

const ODR_URL = "https://ec.europa.eu/consumers/odr/";

function renderBlock(block: LegalBlock, index: number) {
  switch (block.kind) {
    case "p":
      return (
        <p key={index} className="text-sm sm:text-base text-muted-foreground mt-2 first:mt-0">
          {block.text}
        </p>
      );
    case "h3":
      return (
        <h3 key={index} className="text-sm sm:text-base font-medium text-foreground mt-4">
          {block.text}
        </h3>
      );
    case "h4":
      return (
        <h4 key={index} className="font-medium text-foreground text-sm sm:text-base mt-3 first:mt-0">
          {block.text}
        </h4>
      );
    case "ul":
      return (
        <ul key={index} className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
          {block.items.map((item) => (
            <li key={item} className="text-sm sm:text-base">
              {item}
            </li>
          ))}
        </ul>
      );
    case "email":
      return (
        <p key={index} className="text-sm sm:text-base text-muted-foreground mt-2 first:mt-0">
          {block.label}:{" "}
          <a href={`mailto:${LEGAL_EMAIL}`} className="text-primary hover:underline">
            {LEGAL_EMAIL}
          </a>
        </p>
      );
    case "odr":
      return (
        <div key={index}>
          <p className="text-muted-foreground text-sm sm:text-base mt-3">
            {block.before}{" "}
            <a
              href={ODR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {ODR_URL}
            </a>
          </p>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">{block.after}</p>
        </div>
      );
    default:
      return null;
  }
}

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <div className="max-w-none space-y-6 sm:space-y-8">
      {document.sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{section.title}</h2>
          <div className="mt-3 space-y-1">
            {section.blocks.map((block, index) => renderBlock(block, index))}
          </div>
        </section>
      ))}

      {document.disclaimer ? (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
          <p className="text-xs sm:text-sm text-muted-foreground">{document.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
