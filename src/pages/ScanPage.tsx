import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import IngredientsList from "@/components/IngredientsList";

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setAnalyzing(true);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Call edge function to analyze image
      const { data, error } = await supabase.functions.invoke(
        "analyze-ingredients",
        {
          body: { image: base64 },
        }
      );

      if (error) throw error;

      setIngredients(data.ingredients || []);
      toast({
        title: "Zutaten erkannt!",
        description: `${data.ingredients?.length || 0} Zutaten gefunden.`,
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Fehler",
        description: "Bild konnte nicht analysiert werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleGenerateRecipes = () => {
    navigate("/recipes", { state: { ingredients } });
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">
            Kühlschrank <span className="text-neon">scannen</span>
          </h1>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Upload Area */}
          {!imagePreview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-dashed border-primary/50 rounded-3xl p-12 text-center hover:border-primary transition-all cursor-pointer bg-card"
              onClick={() => document.getElementById("imageInput")?.click()}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-2">
                Foto hochladen
              </h2>
              <p className="text-muted-foreground mb-6">
                Mache ein Foto von deinem Kühlschrank oder wähle ein Bild aus
              </p>
              <Button className="gradient-neon text-black font-semibold glow-button">
                Bild auswählen
              </Button>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Image Preview */}
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={imagePreview}
                  alt="Kühlschrank"
                  className="w-full h-auto"
                />
              </div>

              {analyzing ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-lg text-muted-foreground">
                    KI analysiert deine Zutaten...
                  </p>
                </div>
              ) : (
                <>
                  {/* Ingredients List */}
                  <IngredientsList
                    ingredients={ingredients}
                    onIngredientsChange={setIngredients}
                  />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => {
                        setImagePreview(null);
                        setIngredients([]);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Neues Foto
                    </Button>
                    <Button
                      onClick={handleGenerateRecipes}
                      disabled={ingredients.length === 0}
                      className="flex-1 gradient-neon text-black font-semibold glow-button"
                    >
                      Rezepte generieren
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
