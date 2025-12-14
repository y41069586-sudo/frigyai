import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Share2, Copy, MessageCircle, Send, Facebook, Twitter, Mail, Check } from "lucide-react";
import { motion } from "framer-motion";

interface Recipe {
  id: string;
  title: string;
  calories: number;
  ingredients: string[];
}

interface ShareRecipeDialogProps {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareRecipeDialog = ({ recipe, open, onOpenChange }: ShareRecipeDialogProps) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/recipe/${recipe.id}`;
  const shareText = `🍽️ ${recipe.title} - Nur ${recipe.calories} kcal!\n\nZutaten: ${recipe.ingredients.slice(0, 3).join(", ")}${recipe.ingredients.length > 3 ? "..." : ""}\n\nEntdeckt mit FrigBuddy!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link kopiert! 📋" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  const handleShare = async (platform: string) => {
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(`Rezept: ${recipe.title}`)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,noreferrer");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled sharing
      }
    }
  };

  const shareOptions = [
    { id: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "bg-green-500" },
    { id: "telegram", icon: Send, label: "Telegram", color: "bg-blue-500" },
    { id: "facebook", icon: Facebook, label: "Facebook", color: "bg-blue-600" },
    { id: "twitter", icon: Twitter, label: "Twitter", color: "bg-sky-500" },
    { id: "email", icon: Mail, label: "E-Mail", color: "bg-gray-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Rezept teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe Preview */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="font-semibold text-lg">{recipe.title}</h3>
            <p className="text-sm text-muted-foreground">{recipe.calories} kcal</p>
          </div>

          {/* Native Share Button (if available) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <Button onClick={handleNativeShare} className="w-full gradient-neon text-black">
              <Share2 className="h-4 w-4 mr-2" />
              Teilen
            </Button>
          )}

          {/* Share Options Grid */}
          <div className="grid grid-cols-5 gap-2">
            {shareOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleShare(option.id)}
                className={`${option.color} text-white p-3 rounded-xl flex flex-col items-center gap-1 hover:opacity-80 transition-opacity`}
              >
                <option.icon className="h-5 w-5" />
                <span className="text-[10px]">{option.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Copy Link */}
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm truncate">
              {shareUrl}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRecipeDialog;
