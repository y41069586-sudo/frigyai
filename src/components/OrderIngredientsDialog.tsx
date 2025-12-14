import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink, CheckCircle2 } from "lucide-react";

interface OrderIngredientsDialogProps {
  ingredients: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderIngredientsDialog = ({ ingredients, open, onOpenChange }: OrderIngredientsDialogProps) => {
  const searchQuery = encodeURIComponent(ingredients.join(" "));

  const deliveryServices = [
    {
      id: "rewe",
      name: "REWE",
      logo: "🛒",
      color: "bg-red-500",
      url: `https://shop.rewe.de/productList?search=${searchQuery}`,
      description: "Schnelle Lieferung",
    },
    {
      id: "amazon-fresh",
      name: "Amazon Fresh",
      logo: "📦",
      color: "bg-orange-500",
      url: `https://www.amazon.de/s?k=${searchQuery}&i=amazonfresh`,
      description: "Prime Lieferung",
    },
    {
      id: "edeka",
      name: "EDEKA",
      logo: "🏪",
      color: "bg-yellow-500",
      url: `https://www.edeka.de/suche.html?query=${searchQuery}`,
      description: "Frische Produkte",
    },
    {
      id: "flink",
      name: "Flink",
      logo: "⚡",
      color: "bg-pink-500",
      url: `https://www.goflink.com/de-DE/`,
      description: "In 10 Min geliefert",
    },
    {
      id: "gorillas",
      name: "Getir",
      logo: "🦍",
      color: "bg-purple-500",
      url: `https://getir.com/de/`,
      description: "Schnelllieferung",
    },
  ];

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
          <div className="bg-muted/50 rounded-xl p-4 max-h-40 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Folgende Zutaten werden gesucht:</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          {/* Delivery Services */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Wähle einen Lieferdienst:</p>
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

          <p className="text-xs text-muted-foreground text-center">
            Du wirst zum Lieferdienst weitergeleitet, um die Zutaten zu bestellen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderIngredientsDialog;
