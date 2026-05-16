import fs from "fs";

const path = "src/components/MacroTracker.tsx";
let s = fs.readFileSync(path, "utf8");

const loadingOld = `  // Show loading state while fetching settings from database
  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <motion.div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></motion.div>
        <p className="text-muted-foreground">{t.loading || 'Wird geladen...'}</p>
      </motion.div>
    );
  }`;

const loadingOld2 = `  // Show loading state while fetching settings from database
  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">{t.loading || 'Wird geladen...'}</p>
      </motion.div>
    );
  }`;

if (s.includes(loadingOld)) {
  s = s.replace(loadingOld, "  if (settingsLoading) {\n    return null;\n  }");
} else if (s.includes(loadingOld2)) {
  s = s.replace(loadingOld2, "  if (settingsLoading) {\n    return null;\n  }");
} else {
  s = s.replace(
    /  \/\/ Show loading state while fetching settings from database[\s\S]*?  \}\n\n  if \(step === 'onboarding'\)/,
    "  if (settingsLoading) {\n    return null;\n  }\n\n  if (step === 'onboarding')",
  );
}

s = s.replace(
  `    return (
      <div className="space-y-4">
        {/* Progress dots */}`,
  `    return (
      <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-background px-4 py-6 safe-top safe-bottom">
        {/* Progress dots */}`,
);

s = s.replace(
  `        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">`,
  `        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <>`,
);

const pageUiStart = "      {/* Gleiches Tracker-Widget wie im Dashboard */}";
const pageUiEnd = "      {/* Edit Macro Goals Dialog */}";
const startIdx = s.indexOf(pageUiStart);
const endIdx = s.indexOf(pageUiEnd);
if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find page UI markers", startIdx, endIdx);
  process.exit(1);
}
s = s.slice(0, startIdx) + "      " + s.slice(endIdx);

s = s.replace(
  /      <Card ref=\{addFoodSectionRef\}[\s\S]*?      <\/Card>\n\n/,
  `      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />

`,
);

s = s.replace(
  /      \{\/\* Food Entries - Improved Design \*\}[\s\S]*?      \{\/\* Success Overlay/,
  "      {/* Success Overlay",
);

s = s.replace(
  'className="relative rounded-2xl overflow-hidden"',
  'className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 p-4"',
);

if (s.trimEnd().endsWith("    </div>\n  );\n};")) {
  s = s.slice(0, s.lastIndexOf("    </motion.div>\n  );\n};")) + "    </>\n  );\n};";
} else {
  s = s.replace(/\n    <\/div>\n  \);\n\};\s*$/, "\n    </>\n  );\n};");
}

fs.writeFileSync(path, s);
console.log("MacroTracker stripped");
