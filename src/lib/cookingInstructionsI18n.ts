export type InstructionLang = "de" | "en" | "fr";

type HintPhase = "Vorbereitung" | "Kochen" | "Garen" | "Pause" | "Anrichten";

export function resolveInstructionLang(raw?: string | null): InstructionLang {
  return raw === "en" || raw === "fr" ? raw : "de";
}

const TIP_PREFIX: Record<InstructionLang, string> = {
  de: "Tipp:",
  en: "Tip:",
  fr: "Conseil:",
};

export function formatStepTipPrefix(lang: InstructionLang): string {
  return TIP_PREFIX[lang];
}

export function setupStepText(lang: InstructionLang, mealName: string): string {
  if (lang === "en") {
    return `Clean the workspace, set out cutting board, sharp knife, bowls, and kitchen scale. Read the recipe for “${mealName}” so you know the flow.`;
  }
  if (lang === "fr") {
    return `Nettoyer le plan de travail, sortir planche, couteau, bols et balance. Lire la recette « ${mealName} » pour connaître les etapes.`;
  }
  return `Arbeitsfläche säubern, Schneidebrett, scharfes Messer, Schüsseln und Küchenwaage bereitlegen. Rezept „${mealName}“ durchlesen, damit du den Ablauf kennst.`;
}

export function serveStepText(lang: InstructionLang, mealName: string): string {
  if (lang === "en") {
    return `Plate “${mealName}” on warmed dishes, season with salt and pepper, and serve right away while still hot.`;
  }
  if (lang === "fr") {
    return `Dresser « ${mealName} » sur assiettes chaudes, assaisonner et servir tout de suite, bien chaud.`;
  }
  return `„${mealName}“ auf vorgewärmten Tellern anrichten, mit Salz und Pfeffer abschmecken, sofort servieren – am besten noch heiß genießen.`;
}

export function prepHintForIngredient(lang: InstructionLang, name: string, amount: string): string {
  const n = name.toLowerCase();
  const qty = amount ? `${amount} ` : "";

  if (/ei|egg|oeuf/.test(n)) {
    if (lang === "en") return `${qty}${name}: take out of the fridge ~10 min early to reach room temperature.`;
    if (lang === "fr") return `${qty}${name} : sortir du frigo ~10 min avant pour température ambiante.`;
    return `${qty}${name} aus dem Kühlschrank holen, auf Zimmertemperatur kommen lassen (ca. 10 Min vorher).`;
  }
  if (/hähnchen|pute|fleisch|hack|steak|schnitzel|wurst|chicken|turkey|meat|beef|pork|sausage/.test(n)) {
    if (lang === "en") return `${qty}${name}: pat dry, trim sinew, cut into bite-size pieces.`;
    if (lang === "fr") return `${qty}${name} : eponger, retirer les nerfs, couper en morceaux.`;
    return `${qty}${name}: trocken tupfen, große Sehnen entfernen, in mundgerechte Stücke schneiden.`;
  }
  if (/kartoffel|möhre|zwiebel|knoblauch|paprika|gurke|salat|tomate|potato|carrot|onion|garlic|pepper|cucumber|lettuce|tomato/.test(n)) {
    if (lang === "en") return `${qty}${name}: wash well, peel if needed, cut into even pieces.`;
    if (lang === "fr") return `${qty}${name} : laver, éplucher si besoin, couper regulierement.`;
    return `${qty}${name}: gründlich waschen, schälen falls nötig, in gleichmäßige Stücke schneiden.`;
  }
  if (/reis|nudel|pasta|spaghetti|hafer|müsli|rice|oat|oatmeal|noodle/.test(n)) {
    if (lang === "en") return `${qty}${name}: measure and set aside.`;
    if (lang === "fr") return `${qty}${name} : peser/mesurer et preparer.`;
    return `${qty}${name} abmessen und bereitstellen.`;
  }
  if (/milch|sahne|joghurt|quark|käse|butter|milk|cream|yogurt|cheese/.test(n)) {
    if (lang === "en") return `${qty}${name}: set out and portion if needed.`;
    if (lang === "fr") return `${qty}${name} : preparer et portionner si besoin.`;
    return `${qty}${name} bereitstellen und bei Bedarf in Stückchen/Würfeln portionieren.`;
  }
  if (lang === "en") return `${qty}${name}: measure, wash or cut as needed.`;
  if (lang === "fr") return `${qty}${name} : mesurer, laver ou couper si besoin.`;
  return `${qty}${name}: abmessen, ggf. waschen oder in passende Stücke schneiden.`;
}

type HintStep = { minutes: number; phase: HintPhase; text: string; tip?: string };

export function cookingHintsForMeal(lang: InstructionLang, name: string): HintStep[] {
  const n = name.toLowerCase();

  if (/nudel|pasta|spaghetti|penne|noodle/.test(n)) {
    if (lang === "en") {
      return [
        { minutes: 2, phase: "Kochen", text: "Bring a large pot of salted water to a rolling boil (~1 L water per 100 g pasta)." },
        {
          minutes: 8,
          phase: "Garen",
          text: "Cook pasta al dente per package directions (usually 8–11 min). Stir occasionally.",
          tip: "Save a ladle of pasta water before draining — it helps bind the sauce.",
        },
      ];
    }
    if (lang === "fr") {
      return [
        { minutes: 2, phase: "Kochen", text: "Porter une grande casserole d'eau salee a gros bouillons (~1 L pour 100 g)." },
        {
          minutes: 8,
          phase: "Garen",
          text: "Cuire les pates al dente selon le paquet (8–11 min). Remuer de temps en temps.",
          tip: "Garder une louche d'eau de cuisson — lie mieux la sauce.",
        },
      ];
    }
    return [
      { minutes: 2, phase: "Kochen", text: "Großen Topf mit reichlich Salzwasser zum kräftigen Kochen bringen (ca. 1 Liter Wasser pro 100 g Nudeln)." },
      {
        minutes: 8,
        phase: "Garen",
        text: "Nudeln einlegen, nach Packungsangabe al dente kochen (meist 8–11 Min). Gelegentlich umrühren, damit nichts anklebt.",
        tip: "Eine Minute vor Ende eine Schöpfkelle Kochwasser aufheben – hilft beim Binden der Soße.",
      },
    ];
  }

  if (/reis|rice/.test(n)) {
    if (lang === "en") {
      return [
        { minutes: 1, phase: "Kochen", text: "Rinse rice in a sieve under cold water until the water runs clearer." },
        {
          minutes: 15,
          phase: "Garen",
          text: "Bring double the volume of water with a pinch of salt to a boil, reduce heat, cover and simmer 12–15 min until absorbed.",
          tip: "Keep the lid on — steam escaping makes rice gummy.",
        },
      ];
    }
    if (lang === "fr") {
      return [
        { minutes: 1, phase: "Kochen", text: "Rincer le riz au crible jusqu'a eau plus claire." },
        {
          minutes: 15,
          phase: "Garen",
          text: "Porter le double d'eau salee a ebullition, couvrir et mijoter 12–15 min.",
          tip: "Garder le couvercle — sinon le riz devient collant.",
        },
      ];
    }
    return [
      { minutes: 1, phase: "Kochen", text: "Reis in einem Sieb kalt abspülen, bis das Wasser klarer wird." },
      {
        minutes: 15,
        phase: "Garen",
        text: "Reis mit der doppelten Menge Wasser und einer Prise Salz aufkochen, Hitze reduzieren, zugedeckt 12–15 Min köcheln lassen, bis das Wasser aufgesogen ist.",
        tip: "Topf nicht öffnen – Dampf entweicht und der Reis wird gummig.",
      },
    ];
  }

  if (/schnitzel|steak|hähnchen|lachs|fisch|brat|pfanne|chicken|salmon|fish|pan/.test(n)) {
    if (lang === "en") {
      return [
        { minutes: 2, phase: "Kochen", text: "Heat pan on medium-high with 1–2 tbsp oil or butter until lightly shimmering." },
        {
          minutes: 6,
          phase: "Kochen",
          text: "Sear protein on all sides; flip once when golden. Check doneness (fish: opaque; chicken: not pink inside).",
          tip: "Too crowded = steaming not searing. Cook in batches if needed.",
        },
      ];
    }
    if (lang === "fr") {
      return [
        { minutes: 2, phase: "Kochen", text: "Chauffer la poele a feu moyen-fort avec 1–2 c. a soupe d'huile ou beurre." },
        {
          minutes: 6,
          phase: "Kochen",
          text: "Dorer la proteine de chaque cote; retourner une fois bien doree. Verifier la cuisson.",
          tip: "Trop charge = ca cuit a la vapeur. Faire en deux fois si besoin.",
        },
      ];
    }
    return [
      { minutes: 2, phase: "Kochen", text: "Pfanne auf mittlere bis hohe Stufe vorheizen, 1–2 EL Öl oder Butter erhitzen, bis es leicht schäumt." },
      {
        minutes: 6,
        phase: "Kochen",
        text: "Protein von allen Seiten anbraten, nur einmal wenden wenn die Unterseite goldbraun ist. Kerntemperatur/Farbe prüfen (Fisch: matt und flockig; Hähnchen: innen nicht rosa).",
        tip: "Zu viel in der Pfanne = es dämpft statt zu braten. Lieber in zwei Durchgängen.",
      },
    ];
  }

  if (/suppe|eintopf|curry|soße|sauce|soup|stew/.test(n)) {
    if (lang === "en") {
      return [
        { minutes: 3, phase: "Kochen", text: "Sweat aromatics (onion, garlic) in a little oil over medium heat." },
        { minutes: 12, phase: "Garen", text: "Add liquid and remaining ingredients, boil then simmer 10–15 min until cooked and slightly thickened. Stir regularly." },
      ];
    }
    if (lang === "fr") {
      return [
        { minutes: 3, phase: "Kochen", text: "Faire revenir aromates (oignon, ail) dans un peu d'huile." },
        { minutes: 12, phase: "Garen", text: "Ajouter liquide et reste, bouillir puis mijoter 10–15 min. Remuer regulierement." },
      ];
    }
    return [
      { minutes: 3, phase: "Kochen", text: "Topf oder große Pfanne auf mittlere Stufe stellen, aromatische Zutaten (Zwiebel, Knoblauch) in etwas Öl glasig dünsten." },
      { minutes: 12, phase: "Garen", text: "Flüssigkeit und restliche Zutaten zugeben, aufkochen, dann 10–15 Min köcheln lassen, bis alles gar und die Soße leicht eingedickt ist. Regelmäßig umrühren." },
    ];
  }

  if (/ofen|auflauf|überback|pizza|oven|bake|casserole/.test(n)) {
    if (lang === "en") {
      return [
        { minutes: 3, phase: "Garen", text: "Preheat oven to 180–200 °C (350–390 °F)." },
        {
          minutes: 20,
          phase: "Garen",
          text: "Bake in the center of the oven until golden on top and cooked through.",
          tip: "Keep the oven door closed — temperature drops quickly when opened.",
        },
      ];
    }
    if (lang === "fr") {
      return [
        { minutes: 3, phase: "Garen", text: "Prechauffer le four a 180–200 °C." },
        {
          minutes: 20,
          phase: "Garen",
          text: "Enfourner au centre jusqu'a dore et bien cuit.",
          tip: "Garder la porte fermee — la chaleur chute vite.",
        },
      ];
    }
    return [
      { minutes: 3, phase: "Garen", text: "Backofen auf 180–200 °C Ober-/Unterhitze vorheizen." },
      {
        minutes: 20,
        phase: "Garen",
        text: "Form oder Blech in die Mitte des Ofens schieben, bis Oberfläche goldbraun und die Füllung durchgegart ist.",
        tip: "Ofentür möglichst geschlossen halten – Temperatur fällt sonst stark ab.",
      },
    ];
  }

  if (lang === "en") {
    return [{ minutes: 5, phase: "Kochen", text: "Cook all prepared ingredients in a suitable pot or pan over medium heat, stirring until hot and done." }];
  }
  if (lang === "fr") {
    return [{ minutes: 5, phase: "Kochen", text: "Cuire tous les ingredients prepares a feu moyen en remuant jusqu'a chaud et cuit." }];
  }
  return [{ minutes: 5, phase: "Kochen", text: "Alle vorbereiteten Zutaten in passendem Topf oder Pfanne auf mittlerer Stufe unter Rühren garen, bis alles durchgegart und heiß ist." }];
}
