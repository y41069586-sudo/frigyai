import type { Lang } from "./types.ts";

export type PoolSet = { b: string[]; m: string[]; s: string[] };

const DE: Record<string, PoolSet> = {
  balanced: {
    b: [
      "Haferflocken Beeren", "Skyr Obst", "Rührei Vollkornbrot", "Joghurt Banane", "Hüttenkäse Toast",
      "Avocado Brot", "Müsli Apfel", "Porridge Nüsse", "French Toast", "Quark Honig",
    ],
    m: [
      "Hähnchen Reis Pfanne", "Lachs Kartoffeln", "Puten Gemüse Bowl", "Pasta Tomate Basilikum",
      "Rind Pfanne Asia", "Thunfisch Salat", "Linsen Curry", "Gyros Bowl", "Falafel Teller",
      "Wrap Hähnchen", "Spaghetti Bolognese", "Fish and Chips Ofen", "Chili con Carne", "Risotto Pilze",
    ],
    s: ["Apfel Nüsse", "Quark Beeren", "Vollkornbrot Aufstrich", "Obst Joghurt", "Hummus Gemüse", "Protein Riegel", "Käse Sticks"],
  },
  vegan: {
    b: [
      "Haferflocken Beeren", "Tofu-Scramble", "Avocado Brot", "Chia Pudding", "Banane Erdnuss",
      "Obstsalat", "Hummus Brot", "Porridge Kokos", "Smoothie Bowl", "Vollkorn mit Marmelade",
    ],
    m: [
      "Linsen Curry", "Tofu Reis Pfanne", "Kichererbsen Bowl", "Gemüsepfanne Sesam", "Buddha Bowl",
      "Tempeh Salat", "Bohnen Chili", "Pad Thai Tofu", "Falafel mit Tahini", "Linsensuppe",
      "Veggie Burger Bowl", "Couscous Gemüse", "Thai Gemüse Kokos", "Burrito Bowl vegan", "Ramen Gemüsebrühe",
    ],
    s: ["Apfel Nüsse", "Hummus Gemüse", "Obst Mix", "Edamame", "Nussriegel", "Rice Cakes Avocado", "Energy Balls"],
  },
  vegetarian: {
    b: [
      "Haferflocken Beeren", "Rührei Toast", "Joghurt Granola", "Käse Brötchen", "Pancakes Beeren",
      "Obst Quark", "Müsli Mandel", "Eier Benedict light",
    ],
    m: [
      "Caprese Pasta", "Spinat Ricotta Nudeln", "Gemüse Lasagne", "Kichererbsen Curry", "Falafel Teller",
      "Margherita Pizza Ofen", "Risotto Safran", "Eier Fried Rice", "Halloumi Grill Gemüse", "Linsen Bolognese",
      "Paneer Tikka", "Quiche Gemüse", "Burrito vegetarisch",
    ],
    s: ["Käse Sticks", "Obst Joghurt", "Hummus Karotten", "Nuss Mix", "Smoothie"],
  },
  keto: {
    b: [
      "Rührei Avocado", "Speck Eier", "Käse Omelett", "Griechischer Joghurt Nüsse", "Chia Kokos",
      "Salami Eier", "Smoked Salmon Frühstück",
    ],
    m: [
      "Lachs Brokkoli Butter", "Hähnchen Caesar ohne Croutons", "Rindersteak Blumenkohl", "Puten Zucchini Pfanne",
      "Thunfisch Salat Olive", "Hackfleisch Kohl", "Garnelen Knoblauch", "Ente Gemüse", "Lamm Rosmarin",
      "Schweinefilet Pilze", "Zucchini Lasagne keto", "Cobb Salad",
    ],
    s: ["Käsewürfel", "Nuss Mix", "Gurke Dip", "Oliven", "Pepperoni Snack"],
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
      "Ente Rotkohl", "Schweine Medaillons", "Lamm Karotten", "Fisch Kräuter",
    ],
    s: ["Mandeln", "Beeren", "Rind Biltong Style", "Karotten Hummus ohne Kichererbsen"],
  },
};

const EN: Record<string, PoolSet> = {
  balanced: {
    b: ["Oatmeal berries", "Greek yogurt fruit", "Scrambled eggs toast", "Yogurt banana", "Cottage cheese toast", "Avocado toast", "Granola apple"],
    m: ["Chicken rice pan", "Salmon potatoes", "Turkey veggie bowl", "Pasta tomato", "Beef stir fry", "Tuna salad", "Lentil curry", "Chicken wrap", "Beef tacos", "Shrimp pasta", "Pork chops veg", "Lamb stew"],
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
    m: ["Salmon broccoli", "Chicken caesar no croutons", "Steak cauliflower", "Turkey zucchini", "Tuna olive salad", "Beef cabbage", "Shrimp garlic", "Pork tenderloin mushrooms", "Cobb salad", "Zucchini lasagna keto"],
    s: ["Cheese cubes", "Nut mix", "Cucumber dip", "Olives"],
  },
  "low-carb": {
    b: ["Eggs spinach", "Skyr nuts", "Veggie omelette", "Cottage cheese berries"],
    m: ["Chicken salad", "Salmon asparagus", "Turkey pepper pan", "Beef veg wok", "Fish zucchini", "Shrimp salad", "Steak green beans"],
    s: ["Nuts", "Cheese", "Veggie sticks", "Boiled eggs"],
  },
  paleo: {
    b: ["Eggs sweet potato", "Fruit nuts", "Mushroom scramble"],
    m: ["Chicken roast veg", "Salmon asparagus", "Beef stir fry", "Turkey sweet potato", "Pork zucchini", "Duck cabbage", "Fish herbs"],
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
