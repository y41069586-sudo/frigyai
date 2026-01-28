/**
 * Categorization system for organizing shopping list items
 * Maps ingredient names to categories for better shopping experience
 */

export type IngredientCategory = 
  | 'Obst & Gemüse'
  | 'Fleisch & Fisch'
  | 'Milchprodukte'
  | 'Brot & Getreide'
  | 'Pantry'
  | 'Sonstiges';

interface CategoryConfig {
  keywords: string[];
  category: IngredientCategory;
}

const categoryMappings: CategoryConfig[] = [
  // Obst & Gemüse
  {
    keywords: ['apfel', 'banane', 'orange', 'zitrone', 'tomate', 'gurke', 'paprika', 'zwiebel', 'knoblauch', 'salat', 'spinat', 'broccoli', 'karotte', 'blumenkohl', 'kartoffel', 'süßkartoffel', 'traube', 'erdbeere', 'blaubeere', 'melone', 'ananas', 'mango', 'kiwi', 'avocado', 'kirsche', 'pfirsich', 'birne', 'wassermelone', 'aubergine', 'zucchini', 'champignon', 'pilz', 'bohne', 'rote bete', 'sauerkraut', 'kohlrabi', 'fenchel', 'lauch', 'porree', 'sellerie', 'pastinake', 'chicorée', 'endivie', 'feldsalat'],
    category: 'Obst & Gemüse'
  },
  // Fleisch & Fisch
  {
    keywords: ['hähnchen', 'huhn', 'rind', 'schwein', 'lamm', 'pute', 'truthahn', 'ente', 'gans', 'kalb', 'fisch', 'lachs', 'forelle', 'seeforelle', 'kabeljau', 'dorsch', 'heilbutt', 'thunfisch', 'sardine', 'hering', 'makrele', 'scholle', 'seezunge', 'flunder', 'barsch', 'brasse', 'meeresfrüchte', 'garnele', 'muschel', 'krebs', 'langusten', 'tintenfisch', 'calamares', 'oktopus', 'schinken', 'speck', 'bacon', 'wurst', 'salami', 'leberwurst', 'blutwurst', 'bratwurst', 'knackwurst', 'mettwurst', 'fleischschnitzel', 'fleisch', 'steak', 'kotelette', 'braten', 'gulasch', 'rind hack', 'schweinehack', 'hack', 'hackfleisch'],
    category: 'Fleisch & Fisch'
  },
  // Milchprodukte
  {
    keywords: ['milch', 'joghurt', 'quark', 'käse', 'butter', 'sahne', 'creme fraîche', 'schmand', 'sour cream', 'frischkäse', 'mozzarella', 'feta', 'emmentaler', 'greyerzer', 'camembert', 'brie', 'gorgonzola', 'roquefort', 'kefir', 'buttermilch', 'ayran', 'pudding', 'puddinggulash', 'mascarpone', 'ricotta', 'halloumi', 'paneer', 'harissa', 'cheddar', 'gouda', 'edamer', 'tilsiter', 'bergkäse', 'bergisch', 'limburger', 'pecorino', 'parmigiano', 'parmesan'],
    category: 'Milchprodukte'
  },
  // Brot & Getreide
  {
    keywords: ['brot', 'brötchen', 'semmel', 'weißbrot', 'graubrot', 'roggenbrot', 'vollkornbrot', 'knäckebrot', 'tortilla', 'fladenbrot', 'naan', 'pasta', 'nudel', 'spaghetti', 'tagliatelle', 'penne', 'fusilli', 'ravioli', 'tortellini', 'mehl', 'reis', 'basmatireis', 'wildreis', 'risotto', 'couscous', 'bulgur', 'hirse', 'hafer', 'oat', 'müsli', 'cornflakes', 'getreide', 'mais', 'polenta', 'grütze'],
    category: 'Brot & Getreide'
  },
  // Pantry / Lagerbestände
  {
    keywords: ['öl', 'olivenöl', 'sonnenblumenöl', 'rapsöl', 'sesamöl', 'kokosnussöl', 'nussöl', 'essig', 'balsamico', 'weißweinessig', 'rotweinessig', 'apfelessig', 'sojasoße', 'soy sauce', 'worcester sauce', 'fischsoße', 'salz', 'zucker', 'honig', 'marmelade', 'konfitüre', 'erdnussbutter', 'nussmus', 'tahini', 'hummus', 'pesto', 'tomatenmark', 'tomatenpüree', 'tomatensoße', 'konserven', 'dosen', 'konserviertes', 'gemahlene', 'pfeffer', 'paprika', 'curry', 'muskatnuss', 'basilikum', 'oregano', 'thymian', 'rosmarin', 'minze', 'petersilie', 'dill', 'schnittlauch', 'gewürze', 'salz', 'zucker', 'süßstoff', 'backpulver', 'hefe', 'vanille', 'kakao', 'schokolade', 'nüsse', 'haselnuss', 'mandel', 'walnuss', 'erdnuss', 'pistazie', 'kastanie', 'samen', 'sesam', 'leinsamen', 'chiasamen'],
    category: 'Pantry'
  }
];

/**
 * Categorize an ingredient based on its name
 */
export function categorizeIngredient(ingredientName: string): IngredientCategory {
  const lowerName = ingredientName.toLowerCase().trim();
  
  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => lowerName.includes(keyword) || keyword.includes(lowerName))) {
      return mapping.category;
    }
  }
  
  return 'Sonstiges';
}

/**
 * Group ingredients by category
 */
export interface GroupedIngredients {
  [key in IngredientCategory]?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  price: number;
  purchased: boolean;
}

export function groupByCategory(items: ShoppingItem[]): Array<{
  category: IngredientCategory;
  items: ShoppingItem[];
}> {
  const grouped: { [key in IngredientCategory]?: ShoppingItem[] } = {};
  
  // Define category order for consistent display
  const categoryOrder: IngredientCategory[] = [
    'Obst & Gemüse',
    'Fleisch & Fisch',
    'Milchprodukte',
    'Brot & Getreide',
    'Pantry',
    'Sonstiges'
  ];
  
  // Group items by category
  items.forEach(item => {
    const category = categorizeIngredient(item.name);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category]!.push(item);
  });
  
  // Convert to ordered array
  return categoryOrder
    .filter(category => grouped[category] && grouped[category]!.length > 0)
    .map(category => ({
      category,
      items: grouped[category]!
    }));
}

/**
 * Get category color for visual distinction
 */
export function getCategoryColor(category: IngredientCategory): string {
  const colors: Record<IngredientCategory, string> = {
    'Obst & Gemüse': 'bg-green-500/10 border-green-500/30',
    'Fleisch & Fisch': 'bg-red-500/10 border-red-500/30',
    'Milchprodukte': 'bg-blue-500/10 border-blue-500/30',
    'Brot & Getreide': 'bg-yellow-500/10 border-yellow-500/30',
    'Pantry': 'bg-purple-500/10 border-purple-500/30',
    'Sonstiges': 'bg-gray-500/10 border-gray-500/30'
  };
  return colors[category] || 'bg-gray-500/10 border-gray-500/30';
}

/**
 * Get category icon emoji
 */
export function getCategoryEmoji(category: IngredientCategory): string {
  const emojis: Record<IngredientCategory, string> = {
    'Obst & Gemüse': '🥬',
    'Fleisch & Fisch': '🥩',
    'Milchprodukte': '🧀',
    'Brot & Getreide': '🍞',
    'Pantry': '🥫',
    'Sonstiges': '📦'
  };
  return emojis[category] || '📦';
}
