import Foundation

/// A small, on-device database of common (mostly German) foods with per-portion
/// macros. It exists so the food search returns results **instantly** while the
/// OpenAI-backed `analyze-food` edge function only has to run for foods that
/// aren't already known locally. Values are typical per-portion estimates.
enum FoodDatabase {

    struct Item {
        let name: String
        let calories: Int
        let protein: Int
        let carbs: Int
        let fat: Int
        /// Extra search synonyms (e.g. English names) so "chicken" finds "Hähnchen".
        let keywords: [String]

        init(_ name: String, _ calories: Int, _ protein: Int, _ carbs: Int, _ fat: Int, _ keywords: [String] = []) {
            self.name = name; self.calories = calories; self.protein = protein
            self.carbs = carbs; self.fat = fat; self.keywords = keywords
        }
    }

    /// Per-portion estimates. Portion noted in the name where it isn't obvious.
    static let all: [Item] = [
        // Eggs & dairy
        Item("Ei (gekocht)", 78, 6, 1, 5, ["egg", "eier"]),
        Item("Rührei (2 Eier)", 200, 14, 2, 15, ["scrambled", "eggs"]),
        Item("Magerquark (250g)", 170, 31, 10, 1, ["quark", "curd"]),
        Item("Griechischer Joghurt (150g)", 130, 15, 8, 4, ["joghurt", "yogurt", "greek"]),
        Item("Naturjoghurt (150g)", 90, 6, 11, 3, ["joghurt", "yogurt"]),
        Item("Milch 1,5% (200ml)", 96, 7, 10, 3, ["milch", "milk"]),
        Item("Hüttenkäse (100g)", 98, 11, 3, 4, ["cottage", "cheese"]),
        Item("Gouda (30g)", 110, 8, 0, 9, ["käse", "cheese"]),
        Item("Mozzarella (50g)", 125, 9, 1, 9, ["käse", "cheese"]),
        Item("Butter (10g)", 72, 0, 0, 8, ["butter"]),

        // Meat & fish
        Item("Hähnchenbrust (150g)", 248, 47, 0, 5, ["chicken", "huhn", "hühnchen", "haehnchen"]),
        Item("Putenbrust (150g)", 225, 45, 0, 4, ["turkey", "pute"]),
        Item("Rindersteak (150g)", 375, 39, 0, 24, ["beef", "steak", "rind"]),
        Item("Hackfleisch gemischt (150g)", 375, 27, 0, 30, ["hack", "mince", "ground beef"]),
        Item("Lachs (150g)", 312, 30, 0, 21, ["salmon", "fisch", "fish"]),
        Item("Thunfisch (Dose, 100g)", 116, 26, 0, 1, ["tuna", "thunfisch"]),
        Item("Garnelen (100g)", 99, 24, 0, 1, ["shrimp", "prawns", "garnelen"]),
        Item("Schweinefilet (150g)", 218, 33, 0, 9, ["pork", "schwein"]),
        Item("Bacon (2 Scheiben)", 90, 6, 0, 7, ["bacon", "speck"]),
        Item("Wiener Würstchen (1 Stk)", 130, 5, 1, 12, ["wurst", "sausage"]),

        // Carbs & grains
        Item("Haferflocken (50g)", 185, 7, 30, 4, ["oats", "porridge", "hafer"]),
        Item("Reis gekocht (150g)", 195, 4, 42, 1, ["rice", "reis"]),
        Item("Vollkornreis gekocht (150g)", 165, 4, 34, 2, ["brown rice", "reis"]),
        Item("Nudeln gekocht (150g)", 210, 8, 42, 1, ["pasta", "noodles", "nudeln"]),
        Item("Vollkornnudeln gekocht (150g)", 195, 8, 38, 2, ["pasta", "wholegrain"]),
        Item("Kartoffeln gekocht (200g)", 154, 4, 34, 0, ["potato", "kartoffel"]),
        Item("Süßkartoffel (200g)", 180, 4, 41, 0, ["sweet potato", "süßkartoffel"]),
        Item("Vollkornbrot (1 Scheibe)", 95, 4, 17, 1, ["bread", "brot"]),
        Item("Toastbrot (1 Scheibe)", 75, 2, 14, 1, ["toast", "bread"]),
        Item("Brötchen (1 Stk)", 140, 5, 27, 1, ["roll", "brötchen", "broetchen"]),
        Item("Quinoa gekocht (150g)", 180, 6, 30, 3, ["quinoa"]),
        Item("Couscous gekocht (150g)", 168, 6, 35, 0, ["couscous"]),
        Item("Linsen gekocht (150g)", 174, 12, 30, 1, ["lentils", "linsen"]),
        Item("Kichererbsen (150g)", 246, 13, 41, 4, ["chickpeas", "kichererbsen"]),
        Item("Bohnen (150g)", 165, 11, 30, 1, ["beans", "bohnen"]),

        // Vegetables
        Item("Brokkoli (100g)", 34, 3, 7, 0, ["broccoli", "brokkoli"]),
        Item("Spinat (100g)", 23, 3, 4, 0, ["spinach", "spinat"]),
        Item("Tomate (100g)", 18, 1, 4, 0, ["tomato", "tomate"]),
        Item("Gurke (100g)", 15, 1, 4, 0, ["cucumber", "gurke"]),
        Item("Paprika (100g)", 31, 1, 6, 0, ["pepper", "paprika"]),
        Item("Karotte (100g)", 41, 1, 10, 0, ["carrot", "karotte", "möhre"]),
        Item("Zucchini (100g)", 17, 1, 3, 0, ["zucchini"]),
        Item("Avocado (halb)", 160, 2, 9, 15, ["avocado"]),
        Item("Salat gemischt (100g)", 20, 1, 3, 0, ["salad", "salat"]),
        Item("Champignons (100g)", 22, 3, 3, 0, ["mushroom", "pilze", "champignon"]),

        // Fruit
        Item("Apfel (1 Stk)", 95, 0, 25, 0, ["apple", "apfel"]),
        Item("Banane (1 Stk)", 105, 1, 27, 0, ["banana", "banane"]),
        Item("Orange (1 Stk)", 62, 1, 15, 0, ["orange"]),
        Item("Beeren gemischt (100g)", 50, 1, 11, 0, ["berries", "beeren"]),
        Item("Heidelbeeren (100g)", 57, 1, 14, 0, ["blueberries", "heidelbeeren"]),
        Item("Erdbeeren (100g)", 32, 1, 8, 0, ["strawberries", "erdbeeren"]),
        Item("Trauben (100g)", 69, 1, 18, 0, ["grapes", "trauben"]),

        // Nuts, fats, snacks
        Item("Mandeln (30g)", 174, 6, 6, 15, ["almonds", "mandeln"]),
        Item("Walnüsse (30g)", 196, 5, 4, 20, ["walnuts", "walnüsse"]),
        Item("Erdnussbutter (20g)", 118, 5, 4, 10, ["peanut butter", "erdnussbutter"]),
        Item("Olivenöl (1 EL)", 119, 0, 0, 14, ["olive oil", "olivenöl", "öl"]),
        Item("Proteinriegel (1 Stk)", 200, 20, 21, 6, ["protein bar", "riegel"]),
        Item("Proteinshake (1 Scoop)", 120, 24, 3, 2, ["protein", "shake", "whey", "eiweiß"]),
        Item("Reiswaffel (1 Stk)", 35, 1, 7, 0, ["rice cake", "reiswaffel"]),
        Item("Schokolade (Riegel 50g)", 265, 3, 30, 15, ["chocolate", "schokolade"]),
        Item("Haferkekse (2 Stk)", 120, 2, 18, 5, ["cookies", "kekse"]),

        // Common dishes
        Item("Pizza Margherita (1 Stück)", 270, 11, 33, 10, ["pizza"]),
        Item("Döner", 650, 35, 55, 30, ["doner", "kebab"]),
        Item("Burger", 540, 28, 40, 28, ["burger", "hamburger"]),
        Item("Pommes (150g)", 430, 5, 56, 21, ["fries", "pommes", "chips"]),
        Item("Pfannkuchen (1 Stk)", 175, 5, 22, 7, ["pancake", "pfannkuchen"]),
    ]

    /// Instant, case-insensitive prefix/substring search across name + keywords.
    /// Ranked so that prefix matches on the name come first.
    static func search(_ rawQuery: String, limit: Int = 12) -> [FoodDatabase.Item] {
        let q = rawQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard q.count >= 1 else { return [] }

        func score(_ item: Item) -> Int? {
            let name = item.name.lowercased()
            if name.hasPrefix(q) { return 0 }
            if name.contains(q) { return 1 }
            if item.keywords.contains(where: { $0.hasPrefix(q) }) { return 2 }
            if item.keywords.contains(where: { $0.contains(q) }) { return 3 }
            return nil
        }

        return all
            .compactMap { item -> (Item, Int)? in score(item).map { (item, $0) } }
            .sorted { $0.1 < $1.1 }
            .prefix(limit)
            .map { $0.0 }
    }
}
