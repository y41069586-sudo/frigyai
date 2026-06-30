import Foundation

/// Deterministic, keyword-matched German cooking-step generator.
///
/// The `generate-meal-plan` backend never returns AI cooking instructions for
/// week-plan meals (the prompt forces `instructions: []` to keep generation
/// cheap), so the native app needs to synthesize a step-by-step recipe from
/// just `{name, prepTime, ingredients}` — same approach as the web app's
/// `src/lib/cookingInstructions.ts` / `cookingInstructionsI18n.ts`, ported
/// 1:1 for the German-only native UI.
struct CookingStep: Identifiable {
    let id = UUID()
    let minutes: Int
    let phase: String
    let text: String
    let tip: String?
}

enum CookingInstructions {

    static func generateSteps(mealName: String, prepTime: Int?, ingredients: [PlannedMealIngredient]) -> [CookingStep] {
        let prepTimeMin = max(5, prepTime ?? 20)
        var steps: [CookingStep] = []

        let setupMin = min(3, max(2, Int((Double(prepTimeMin) * 0.1).rounded())))
        steps.append(CookingStep(minutes: setupMin, phase: "Vorbereitung", text: setupStepText(mealName: mealName), tip: nil))

        let prepPerIng = min(4, max(2, Int((Double(prepTimeMin) * 0.35 / Double(max(1, ingredients.count))).rounded())))
        for ing in ingredients {
            steps.append(CookingStep(minutes: prepPerIng, phase: "Vorbereitung", text: prepHint(name: ing.name, amount: ing.amount), tip: nil))
        }

        for hint in cookingHints(mealName: mealName) {
            steps.append(hint)
        }

        let serveMin = max(2, Int((Double(prepTimeMin) * 0.1).rounded()))
        steps.append(CookingStep(minutes: serveMin, phase: "Anrichten", text: serveStepText(mealName: mealName), tip: nil))

        return steps
    }

    // MARK: - Text templates (ported from cookingInstructionsI18n.ts, `de` branch)

    private static func setupStepText(mealName: String) -> String {
        "Arbeitsfläche säubern, Schneidebrett, scharfes Messer, Schüsseln und Küchenwaage bereitlegen. Rezept „\(mealName)“ durchlesen, damit du den Ablauf kennst."
    }

    private static func serveStepText(mealName: String) -> String {
        "„\(mealName)“ auf vorgewärmten Tellern anrichten, mit Salz und Pfeffer abschmecken, sofort servieren – am besten noch heiß genießen."
    }

    private static func prepHint(name: String, amount: String) -> String {
        let n = name.lowercased()
        let qty = amount.isEmpty ? "" : "\(amount) "

        if n.contains(matching: "ei|egg|oeuf") {
            return "\(qty)\(name) aus dem Kühlschrank holen, auf Zimmertemperatur kommen lassen (ca. 10 Min vorher)."
        }
        if n.contains(matching: "hähnchen|pute|fleisch|hack|steak|schnitzel|wurst|chicken|turkey|meat|beef|pork|sausage") {
            return "\(qty)\(name): trocken tupfen, große Sehnen entfernen, in mundgerechte Stücke schneiden."
        }
        if n.contains(matching: "kartoffel|möhre|zwiebel|knoblauch|paprika|gurke|salat|tomate|potato|carrot|onion|garlic|pepper|cucumber|lettuce|tomato") {
            return "\(qty)\(name): gründlich waschen, schälen falls nötig, in gleichmäßige Stücke schneiden."
        }
        if n.contains(matching: "reis|nudel|pasta|spaghetti|hafer|müsli|rice|oat|oatmeal|noodle") {
            return "\(qty)\(name) abmessen und bereitstellen."
        }
        if n.contains(matching: "milch|sahne|joghurt|quark|käse|butter|milk|cream|yogurt|cheese") {
            return "\(qty)\(name) bereitstellen und bei Bedarf in Stückchen/Würfeln portionieren."
        }
        return "\(qty)\(name): abmessen, ggf. waschen oder in passende Stücke schneiden."
    }

    private static func cookingHints(mealName: String) -> [CookingStep] {
        let n = mealName.lowercased()

        if n.contains(matching: "nudel|pasta|spaghetti|penne|noodle") {
            return [
                CookingStep(minutes: 2, phase: "Kochen", text: "Großen Topf mit reichlich Salzwasser zum kräftigen Kochen bringen (ca. 1 Liter Wasser pro 100 g Nudeln).", tip: nil),
                CookingStep(minutes: 8, phase: "Garen", text: "Nudeln einlegen, nach Packungsangabe al dente kochen (meist 8–11 Min). Gelegentlich umrühren, damit nichts anklebt.", tip: "Eine Minute vor Ende eine Schöpfkelle Kochwasser aufheben – hilft beim Binden der Soße."),
            ]
        }
        if n.contains(matching: "reis|rice") {
            return [
                CookingStep(minutes: 1, phase: "Kochen", text: "Reis in einem Sieb kalt abspülen, bis das Wasser klarer wird.", tip: nil),
                CookingStep(minutes: 15, phase: "Garen", text: "Reis mit der doppelten Menge Wasser und einer Prise Salz aufkochen, Hitze reduzieren, zugedeckt 12–15 Min köcheln lassen, bis das Wasser aufgesogen ist.", tip: "Topf nicht öffnen – Dampf entweicht und der Reis wird gummig."),
            ]
        }
        if n.contains(matching: "schnitzel|steak|hähnchen|lachs|fisch|brat|pfanne|chicken|salmon|fish|pan") {
            return [
                CookingStep(minutes: 2, phase: "Kochen", text: "Pfanne auf mittlere bis hohe Stufe vorheizen, 1–2 EL Öl oder Butter erhitzen, bis es leicht schäumt.", tip: nil),
                CookingStep(minutes: 6, phase: "Kochen", text: "Protein von allen Seiten anbraten, nur einmal wenden wenn die Unterseite goldbraun ist. Kerntemperatur/Farbe prüfen (Fisch: matt und flockig; Hähnchen: innen nicht rosa).", tip: "Zu viel in der Pfanne = es dämpft statt zu braten. Lieber in zwei Durchgängen."),
            ]
        }
        if n.contains(matching: "suppe|eintopf|curry|soße|sauce|soup|stew") {
            return [
                CookingStep(minutes: 3, phase: "Kochen", text: "Topf oder große Pfanne auf mittlere Stufe stellen, aromatische Zutaten (Zwiebel, Knoblauch) in etwas Öl glasig dünsten.", tip: nil),
                CookingStep(minutes: 12, phase: "Garen", text: "Flüssigkeit und restliche Zutaten zugeben, aufkochen, dann 10–15 Min köcheln lassen, bis alles gar und die Soße leicht eingedickt ist. Regelmäßig umrühren.", tip: nil),
            ]
        }
        if n.contains(matching: "ofen|auflauf|überback|pizza|oven|bake|casserole") {
            return [
                CookingStep(minutes: 3, phase: "Garen", text: "Backofen auf 180–200 °C Ober-/Unterhitze vorheizen.", tip: nil),
                CookingStep(minutes: 20, phase: "Garen", text: "Form oder Blech in die Mitte des Ofens schieben, bis Oberfläche goldbraun und die Füllung durchgegart ist.", tip: "Ofentür möglichst geschlossen halten – Temperatur fällt sonst stark ab."),
            ]
        }

        return [
            CookingStep(minutes: 5, phase: "Kochen", text: "Alle vorbereiteten Zutaten in passendem Topf oder Pfanne auf mittlerer Stufe unter Rühren garen, bis alles durchgegart und heiß ist.", tip: nil),
        ]
    }
}

private extension String {
    func contains(matching pattern: String) -> Bool {
        range(of: pattern, options: .regularExpression) != nil
    }
}
