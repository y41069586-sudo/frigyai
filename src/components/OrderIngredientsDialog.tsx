import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink, CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface OrderIngredientsDialogProps {
  ingredients: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderIngredientsDialog = ({ ingredients, open, onOpenChange }: OrderIngredientsDialogProps) => {
  const [copied, setCopied] = useState(false);
  
  const searchQuery = encodeURIComponent(ingredients.join(", "));
  
  const deliveryServices = [
    {
      id: "amazon",
      name: "Amazon",
      logo: "📦",
      color: "bg-orange-500",
      url: `https://www.amazon.com/s?k=${searchQuery}`,
      description: "Worldwide delivery",
    },
  ];

  const handleCopyForBring = async () => {
    const bringList = ingredients.join("\n");
    await navigator.clipboard.writeText(bringList);
    setCopied(true);
    toast({
      title: "Für Bring! kopiert",
      description: "Öffne Bring! und füge die Liste ein",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenService = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Zutaten bestellen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ingredients Preview */}
          <div className="bg-muted/50 rounded-xl p-4 max-h-32 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Folgende Zutaten:</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.slice(0, 8).map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  {ingredient}
                </span>
              ))}
              {ingredients.length > 8 && (
                <span className="text-xs text-muted-foreground">
                  +{ingredients.length - 8} weitere
                </span>
              )}
            </div>
          </div>

          {/* Bring! App Button */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Empfohlen:</p>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-3 px-4 border-primary/30 bg-primary/5"
              onClick={handleCopyForBring}
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-400 to-green-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white font-bold">
                  B!
                </div>
                <div className="text-left">
                  <p className="font-semibold">Bring! App</p>
                  <p className="text-xs text-muted-foreground">Liste kopieren & in Bring! einfügen</p>
                </div>
              </div>
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Delivery Services */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Oder direkt beim Lieferdienst suchen:</p>
            {deliveryServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-4"
                  onClick={() => handleOpenService(service.url)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${service.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>
                      {service.logo}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderIngredientsDialog;
