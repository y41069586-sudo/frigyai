import type { MealPlanPrefsInput } from "./mealPlanPrefs.ts";
import type { Lang } from "./types.ts";

export type PoolSet = { b: string[]; m: string[]; s: string[] };

const DE: Record<string, PoolSet> = {
  balanced: {
    b: [
      "Haferflocken mit Beeren", "Joghurt mit Banane", "Rührei mit Brot", "Avocado Toast",
      "Müsli mit Apfel", "Porridge", "Greek Yogurt mit Honig", "Vollkornbrot mit Käse",
    ],
    m: [
      "Reis mit Hackfleisch", "Lachs mit Kartoffeln", "Nudeln mit Tomatensoße", "Hähnchen mit Reis",
      "Thunfisch Salat", "Spaghetti Bolognese", "Hähnchenbrust mit Gemüse", "Kartoffeln mit Schnitzel",
      "Putenpfanne mit Gemüse", "Eintopf mit Brot", "Chili con Carne", "Hähnchen-Wrap",
      "Linsensuppe", "Pizza Margherita",
    ],
    s: [
      "Apfel mit Nüssen", "Quark mit Beeren", "Brot mit Aufstrich", "Obst mit Joghurt",
      "Käse mit Gurke", "Vollkornkeks", "Milchreis",
    ],
  },
  vegan: {
    b: [
      "Haferflocken mit Beeren", "Tofu-Rührei", "Brot mit Marmelade", "Obstsalat",
      "Haferdrink mit Müsli", "Banane mit Erdnussmus", "Toast mit Hummus",
    ],
    m: [
      "Linsensuppe mit Brot", "Tofu mit Reis", "Kichererbsen mit Gemüse", "Gemüsepfanne mit Kartoffeln",
      "Nudeln mit Tomatensauce", "Bohneneintopf", "Reis mit Brokkoli", "Kartoffeln mit Salat",
      "Vollkornnudeln mit Pesto", "Gemüselasagne vegan", "Linsen mit Spätzle",
    ],
    s: ["Apfel mit Nüssen", "Gemüsesticks", "Obstmix", "Brot mit Aufstrich", "Reiswaffeln mit Avocado"],
  },
  vegetarian: {
    b: [
      "Haferflocken Beeren", "Rührei Toast", "Joghurt Granola", "Käse Brötchen", "Pancakes Beeren",
      "Obst Quark", "Müsli Mandel", "Eier Benedict light",
    ],
    m: [
      "Nudeln mit Tomatensoße", "Spinat-Nudeln mit Käse", "Gemüselasagne", "Kichererbsen-Eintopf",
      "Margherita Pizza", "Reis mit Gemüse", "Eier mit Kartoffeln", "Halloumi mit Salat",
      "Linsen-Bolognese", "Gemüsepfanne mit Reis", "Käsespätzle", "Quiche mit Gemüse",
    ],
    s: ["Käse Sticks", "Obst Joghurt", "Hummus Karotten", "Nuss Mix", "Smoothie"],
  },
  keto: {
    b: [
      "Rührei Avocado", "Putenaufschnitt Eier", "Käse Omelett", "Griechischer Joghurt Nüsse", "Chia Kokos",
      "Räucherlachs Eier", "Smoked Salmon Frühstück",
    ],
    m: [
      "Lachs mit Brokkoli", "Hähnchensalat", "Rindersteak mit Blumenkohl", "Pute mit Zucchini",
      "Thunfischsalat", "Hackfleisch mit Kohl", "Hähnchen mit Salat", "Rindersteak mit Pilzen",
      "Zucchini-Auflauf", "Omelett mit Salat", "Frikadellen mit Gemüse",
    ],
    s: ["Käsewürfel", "Nuss Mix", "Gurke Dip", "Oliven", "Mandeln Snack"],
  },
  "low-carb": {
    b: ["Rührei Spinat", "Skyr Nüsse", "Omelett Gemüse", "Hüttenkäse Beeren", "Avocado Ei"],
    m: [
      "Hähnchen Salat", "Lachs Spargel", "Pute Paprika Pfanne", "Rind Gemüse Wok", "Fisch Zucchini",
      "Garnelen Salat", "Hack Salat Bowl", "Curry ohne Reis", "Steak grüne Bohnen",
    ],
    s: ["Nüsse", "Käse", "Gemüse Sticks", "Hard Boiled Eggs", "Oliven"],
  },
  paleo: {
    b: ["Eier Süßkartoffel", "Obst Nüsse", "Rührei Champignons", "Smoothie ohne Milch"],
    m: [
      "Hähnchen Ofengemüse", "Lachs Spargel", "Rind Stir Fry", "Pute Süßkartoffel", "Hack Zucchini",
      "Ente Rotkohl", "Puten Medaillons", "Lamm Karotten", "Fisch Kräuter",
    ],
    s: ["Mandeln", "Beeren", "Rind Biltong Style", "Karotten Hummus ohne Kichererbsen"],
  },
};

const EN: Record<string, PoolSet> = {
  balanced: {
    b: ["Oatmeal berries", "Greek yogurt fruit", "Scrambled eggs toast", "Yogurt banana", "Cottage cheese toast", "Avocado toast", "Granola apple"],
    m: ["Chicken rice pan", "Salmon potatoes", "Turkey veggie bowl", "Pasta tomato", "Beef stir fry", "Tuna salad", "Lentil curry", "Chicken wrap", "Beef tacos", "Shrimp pasta", "Turkey chops veg", "Lamb stew"],
    s: ["Apple nuts", "Cottage cheese", "Sandwich", "Fruit yogurt", "Hummus veggies", "Cheese cubes"],
  },
  vegan: {
    b: ["Oatmeal berries", "Tofu scramble", "Avocado toast", "Chia pudding", "Banana peanut", "Fruit salad", "Hummus toast"],
    m: ["Lentil curry", "Tofu rice pan", "Chickpea bowl", "Veggie stir fry", "Buddha bowl", "Tempeh salad", "Bean chili", "Vegan pad thai", "Falafel plate", "Lentil soup", "Veggie burger bowl", "Coconut veg curry", "Mexican bean bowl", "Ramen veggie"],
    s: ["Apple nuts", "Hummus veggies", "Fruit mix", "Edamame", "Nut bar"],
  },
  vegetarian: {
    b: ["Oatmeal berries", "Eggs toast", "Yogurt granola", "Cheese croissant", "Pancakes berries"],
    m: ["Caprese pasta", "Spinach ricotta pasta", "Veg lasagna", "Chickpea curry", "Falafel plate", "Margherita pizza", "Risotto", "Egg fried rice", "Halloumi grill", "Paneer tikka"],
    s: ["Cheese sticks", "Fruit yogurt", "Hummus carrots", "Nut mix"],
  },
  keto: {
    b: ["Eggs avocado", "Bacon eggs", "Cheese omelette", "Greek yogurt nuts", "Chia coconut"],
    m: ["Salmon broccoli", "Chicken caesar no croutons", "Steak cauliflower", "Turkey zucchini", "Tuna olive salad", "Beef cabbage", "Shrimp garlic", "Turkey tenderloin mushrooms", "Cobb salad", "Zucchini lasagna keto"],
    s: ["Cheese cubes", "Nut mix", "Cucumber dip", "Olives"],
  },
  "low-carb": {
    b: ["Eggs spinach", "Skyr nuts", "Veggie omelette", "Cottage cheese berries"],
    m: ["Chicken salad", "Salmon asparagus", "Turkey pepper pan", "Beef veg wok", "Fish zucchini", "Shrimp salad", "Steak green beans"],
    s: ["Nuts", "Cheese", "Veggie sticks", "Boiled eggs"],
  },
  paleo: {
    b: ["Eggs sweet potato", "Fruit nuts", "Mushroom scramble"],
    m: ["Chicken roast veg", "Salmon asparagus", "Beef stir fry", "Turkey sweet potato", "Turkey zucchini pan", "Duck cabbage", "Fish herbs"],
    s: ["Almonds", "Berries", "Carrot sticks"],
  },
};

const FR: Record<string, PoolSet> = {
  balanced: {
    b: ["Porridge baies", "Yaourt fruits", "Oeufs pain", "Fromage blanc banane", "Avocat pain"],
    m: ["Poulet riz", "Saumon pommes", "Dinde legumes", "Pates tomate", "Boeuf saute", "Thon salade", "Curry lentilles", "Wrap poulet"],
    s: ["Pomme noix", "Fromage blanc", "Sandwich", "Fruit yaourt"],
  },
  vegan: {
    b: ["Porridge baies", "Tofu brouille", "Avocat pain", "Chia pudding", "Salade fruits", "Hummus pain"],
    m: ["Curry lentilles", "Tofu riz", "Bol pois chiches", "Legumes saute", "Buddha bowl", "Salade tempeh", "Chili haricots", "Pad thai tofu", "Falafel", "Soupe lentilles", "Bowl burrito vegan"],
    s: ["Pomme noix", "Hummus legumes", "Fruits", "Edamame"],
  },
  vegetarian: {
    b: ["Porridge baies", "Oeufs pain", "Yaourt granola", "Fromage brioche"],
    m: ["Pates caprese", "Lasagne legumes", "Curry pois chiches", "Falafel", "Pizza margherita", "Risotto", "Riz oeuf"],
    s: ["Fromage", "Fruit yaourt", "Hummus"],
  },
  keto: {
    b: ["Oeufs avocat", "Bacon oeufs", "Omelette fromage"],
    m: ["Saumon brocoli", "Poulet salade", "Steak chou-fleur", "Dinde courgette", "Thon olives", "Porc champignons"],
    s: ["Fromage", "Noix", "Olives"],
  },
  "low-carb": {
    b: ["Oeufs epinards", "Skyr noix", "Omelette legumes"],
    m: ["Salade poulet", "Saumon asperges", "Boeuf legumes", "Poisson courgette"],
    s: ["Noix", "Fromage", "Legumes crus"],
  },
  paleo: {
    b: ["Oeufs patate douce", "Fruits noix"],
    m: ["Poulet legumes rotis", "Saumon asperges", "Boeuf saute", "Porc courgette"],
    s: ["Amandes", "Baies"],
  },
};

const BY_LANG: Record<Lang, Record<string, PoolSet>> = { de: DE, en: EN, fr: FR };

export function resolveDietKey(prefs: string[]): string {
  const p = prefs.filter((x) => x && x !== "none" && x !== "balanced");
  if (p.includes("vegan")) return "vegan";
  if (p.includes("keto")) return "keto";
  if (p.includes("low-carb")) return "low-carb";
  if (p.includes("paleo")) return "paleo";
  if (p.includes("vegetarian")) return "vegetarian";
  return "balanced";
}

export function getDietPools(lang: Lang, prefs: string[]): PoolSet {
  const diet = resolveDietKey(prefs);
  const pools = BY_LANG[lang][diet] ?? BY_LANG[lang].balanced;
  return pools;
}

const CUISINE_EXTENSIONS: Record<Lang, Record<string, Partial<PoolSet>>> = {
  de: {
    asian: {
      b: ["Reisbrei mit Mango", "Miso-Suppe light", "Congee mit Ei"],
      m: ["Gebratene Nudeln", "Reis mit Hähnchen Teriyaki", "Ramen mit Gemüse", "Thai-Curry mild", "Sushi Bowl"],
      s: ["Edamame", "Reiswaffeln mit Avocado", "Mango Stückchen"],
    },
    north_african: {
      b: ["Couscous mit Obst", "Fladenbrot mit Honig", "Joghurt mit Datteln"],
      m: ["Couscous mit Gemüse", "Linseneintopf nordafrikanisch", "Hähnchen mit Kichererbsen", "Harira Suppe"],
      s: ["Datteln", "Hummus mit Karotten", "Oliven Mix"],
    },
    south_african: {
      b: ["Pap mit Milch", "Maisporridge", "Eier mit Bohnen"],
      m: ["Chakalaka mit Reis", "Bobotie light", "Grillhähnchen mit Mais", "Eintopf mit Süßkartoffel"],
      s: ["Mango", "Erdnüsse", "Biltong-Style Rind"],
    },
    italian: {
      b: ["Cappuccino und Croissant light", "Bruschetta", "Ricotta mit Honig"],
      m: ["Spaghetti Aglio e Olio", "Risotto mit Pilzen", "Penne Arrabbiata", "Margherita Pizza", "Minestrone"],
      s: ["Caprese Snack", "Grissini", "Parmesan Stückchen"],
    },
    german: {
      b: ["Brötchen mit Aufschnitt", "Quark mit Kartoffeln", "Bircher Müsli"],
      m: ["Kartoffelsuppe", "Schnitzel mit Salat", "Linseneintopf", "Kohlroulade light", "Bratkartoffeln mit Spiegelei"],
      s: ["Leberkäse Stück", "Brezel", "Apfelstrudel light"],
    },
    american: {
      b: ["Pancakes light", "Bagel mit Frischkäse", "French Toast light"],
      m: ["Burger Bowl", "Chili con Carne", "BBQ Hähnchen mit Mais", "Mac and Cheese light", "Burrito Bowl"],
      s: ["Popcorn", "Nachos light", "Peanut Butter Toast"],
    },
    european: {
      b: ["Croissant light", "Vollkornbrot mit Käse", "Skyr mit Beeren"],
      m: ["Ratatouille mit Reis", "Fisch mit Kartoffeln", "Gulasch light", "Quiche mit Salat"],
      s: ["Crackers mit Käse", "Oliven", "Joghurt"],
    },
    international: {
      b: ["Smoothie Bowl", "Overnight Oats", "Shakshuka light"],
      m: ["Buddha Bowl", "Wrap mit Hähnchen", "Curry mit Reis", "Tacos light", "Falafel Bowl"],
      s: ["Energy Balls", "Trail Mix", "Hummus Wrap"],
    },
  },
  en: {
    asian: {
      b: ["Mango rice porridge", "Miso soup light", "Congee with egg"],
      m: ["Stir fry noodles", "Teriyaki chicken rice", "Ramen veggies", "Thai curry mild", "Sushi bowl"],
      s: ["Edamame", "Rice cakes avocado", "Mango pieces"],
    },
    north_african: {
      b: ["Couscous fruit", "Flatbread honey", "Yogurt dates"],
      m: ["Vegetable couscous", "North African lentil stew", "Chicken chickpeas", "Harira soup"],
      s: ["Dates", "Hummus carrots", "Olives"],
    },
    south_african: {
      b: ["Pap with milk", "Corn porridge", "Eggs beans"],
      m: ["Chakalaka rice", "Bobotie light", "Grilled chicken maize", "Sweet potato stew"],
      s: ["Mango", "Peanuts", "Biltong style beef"],
    },
    italian: {
      b: ["Cappuccino croissant light", "Bruschetta", "Ricotta honey"],
      m: ["Spaghetti aglio olio", "Mushroom risotto", "Penne arrabbiata", "Margherita pizza", "Minestrone"],
      s: ["Caprese snack", "Grissini", "Parmesan cubes"],
    },
    german: {
      b: ["Rolls with cold cuts", "Quark potatoes", "Bircher muesli"],
      m: ["Potato soup", "Schnitzel salad", "Lentil stew", "Cabbage roll light", "Fried potatoes egg"],
      s: ["Leberkase slice", "Pretzel", "Apple strudel light"],
    },
    american: {
      b: ["Pancakes light", "Bagel cream cheese", "French toast light"],
      m: ["Burger bowl", "Chili con carne", "BBQ chicken corn", "Mac and cheese light", "Burrito bowl"],
      s: ["Popcorn", "Nachos light", "Peanut butter toast"],
    },
    european: {
      b: ["Croissant light", "Wholegrain cheese bread", "Skyr berries"],
      m: ["Ratatouille rice", "Fish potatoes", "Goulash light", "Quiche salad"],
      s: ["Crackers cheese", "Olives", "Yogurt"],
    },
    international: {
      b: ["Smoothie bowl", "Overnight oats", "Shakshuka light"],
      m: ["Buddha bowl", "Chicken wrap", "Curry rice", "Tacos light", "Falafel bowl"],
      s: ["Energy balls", "Trail mix", "Hummus wrap"],
    },
  },
  fr: {
    asian: {
      b: ["Porridge mangue", "Soupe miso legere", "Congee oeuf"],
      m: ["Nouilles sautees", "Poulet teriyaki riz", "Ramen legumes", "Curry thai doux", "Bowl sushi"],
      s: ["Edamame", "Galettes riz avocat", "Morceaux mangue"],
    },
    north_african: {
      b: ["Couscous fruits", "Pain plat miel", "Yaourt dattes"],
      m: ["Couscous legumes", "Ragout lentilles", "Poulet pois chiches", "Soupe harira"],
      s: ["Dattes", "Hummus carottes", "Olives"],
    },
    south_african: {
      b: ["Pap lait", "Porridge mais", "Oeufs haricots"],
      m: ["Chakalaka riz", "Bobotie light", "Poulet grille mais", "Ragout patate douce"],
      s: ["Mangue", "Arachides", "Boeuf style biltong"],
    },
    italian: {
      b: ["Cappuccino croissant", "Bruschetta", "Ricotta miel"],
      m: ["Spaghetti aglio olio", "Risotto champignons", "Penne arrabbiata", "Pizza margherita", "Minestrone"],
      s: ["Snack caprese", "Grissini", "Parmesan"],
    },
    german: {
      b: ["Petits pains charcuterie", "Quark pommes", "Muesli bircher"],
      m: ["Soupe pommes de terre", "Escalope salade", "Potee lentilles", "Chou farci light", "Pommes oeuf"],
      s: ["Tranche leberkase", "Bretzel", "Strudel pommes"],
    },
    american: {
      b: ["Pancakes light", "Bagel fromage frais", "Pain perdu light"],
      m: ["Burger bowl", "Chili con carne", "Poulet BBQ mais", "Mac and cheese light", "Burrito bowl"],
      s: ["Popcorn", "Nachos light", "Toast beurre cacahuete"],
    },
    european: {
      b: ["Croissant light", "Pain complet fromage", "Skyr baies"],
      m: ["Ratatouille riz", "Poisson pommes", "Goulash light", "Quiche salade"],
      s: ["Crackers fromage", "Olives", "Yaourt"],
    },
    international: {
      b: ["Smoothie bowl", "Overnight oats", "Shakshuka light"],
      m: ["Buddha bowl", "Wrap poulet", "Curry riz", "Tacos light", "Bowl falafel"],
      s: ["Energy balls", "Trail mix", "Wrap hummus"],
    },
  },
};

const QUICK_MEAL_HINTS = /\b(salat|salad|toast|wrap|sandwich|joghurt|yogurt|quark|obst|fruit|müsli|muesli|hafer|oat|smoothie|omelett|omelet|oeuf|egg|hummus|sticks|reiswaffel|overnight|bruschetta|caprese|edamame|crackers|nachos|popcorn|beeren|berries)\b/i;

function mergeUnique(base: string[], extra: string[]): string[] {
  const seen = new Set(base.map((x) => x.toLowerCase()));
  const out = [...base];
  for (const item of extra) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

/** Preferred titles first — used so cuisine picks win over generic balanced pool. */
function mergeUniquePreferFirst(preferred: string[], fallback: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...preferred, ...fallback]) {
    const key = item.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function filterQuickPool(pool: string[]): string[] {
  const quick = pool.filter((title) => QUICK_MEAL_HINTS.test(title));
  return quick.length >= 3 ? quick : pool;
}

/** Apply cuisine/time preferences to template fallback pools (when OpenAI is unavailable). */
export function enrichPoolsForMealPlanPrefs(
  pools: PoolSet,
  lang: Lang,
  mealPlanPrefs?: MealPlanPrefsInput,
): PoolSet {
  if (!mealPlanPrefs) return pools;

  const extensions = CUISINE_EXTENSIONS[lang] ?? CUISINE_EXTENSIONS.de;
  const cuisineB: string[] = [];
  const cuisineM: string[] = [];
  const cuisineS: string[] = [];

  for (const cuisine of mealPlanPrefs.cuisines) {
    const ext = extensions[cuisine];
    if (!ext) continue;
    if (ext.b?.length) cuisineB.push(...ext.b);
    if (ext.m?.length) cuisineM.push(...ext.m);
    if (ext.s?.length) cuisineS.push(...ext.s);
  }

  // Cuisine dishes first — replacements must not fall back to generic "Oatmeal berries".
  let b = mergeUniquePreferFirst(cuisineB, pools.b);
  let m = mergeUniquePreferFirst(cuisineM, pools.m);
  let s = mergeUniquePreferFirst(cuisineS, pools.s);

  const specificCuisines = mealPlanPrefs.cuisines.filter(
    (c) => c !== "international" && c !== "european",
  );
  if (specificCuisines.length > 0) {
    if (cuisineM.length >= 5) {
      m = mergeUniquePreferFirst(cuisineM, pools.m.slice(0, 3));
    }
    if (cuisineB.length >= 4) {
      b = mergeUniquePreferFirst(cuisineB, pools.b.slice(0, 3));
    }
    if (cuisineS.length >= 3) {
      s = mergeUniquePreferFirst(cuisineS, pools.s.slice(0, 2));
    }
  }

  if (mealPlanPrefs.maxPrepTime === "10") {
    b = filterQuickPool(b);
    m = filterQuickPool(m);
    s = filterQuickPool(s);
  }

  return { b, m, s };
}
