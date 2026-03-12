import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Droplet, Zap, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductDetailsModalProps {
  isOpen: boolean;
  productData?: {
    name: string;
    brand?: string;
    barcode?: string;
    image?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize?: string;
    ingredients?: string;
    ingredientsList?: string[];
  };
  onClose: () => void;
  onAdd?: () => void;
}

export const ProductDetailsModal = ({
  isOpen,
  productData,
  onClose,
  onAdd,
}: ProductDetailsModalProps) => {
  if (!productData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-md bg-gradient-to-b from-card to-card/90 rounded-3xl border border-emerald-200/40 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="sticky top-0 flex justify-end p-4 bg-gradient-to-r from-emerald-100/40 to-green-50/30 border-b border-emerald-200/40 z-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-emerald-200/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-emerald-600" />
              </motion.button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Image */}
              {productData.image && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-center"
                >
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border border-emerald-200/50 shadow-lg">
                    <img
                      src={productData.image}
                      alt={productData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              )}

              {/* Product Name & Brand */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {productData.name}
                </h2>
                {productData.brand && (
                  <p className="text-sm text-emerald-600 font-medium">
                    {productData.brand}
                  </p>
                )}
                {productData.barcode && (
                  <p className="text-xs text-muted-foreground mt-2">
                    EAN: {productData.barcode}
                  </p>
                )}
              </motion.div>

              {/* Macros Grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                {/* Calories */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-100/50 to-red-50/30 border border-red-200/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-700 font-medium">Kalorien</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {productData.calories}
                  </p>
                  {productData.servingSize && (
                    <p className="text-xs text-red-600/70 mt-1">
                      pro {productData.servingSize}
                    </p>
                  )}
                </div>

                {/* Protein */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 border border-emerald-200/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs text-emerald-700 font-medium">Protein</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {productData.protein}g
                  </p>
                </div>

                {/* Carbs */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-100/50 to-yellow-50/30 border border-yellow-200/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <p className="text-xs text-yellow-700 font-medium">Kohlenhydrate</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {productData.carbs}g
                  </p>
                </div>

                {/* Fat */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-100/50 to-orange-50/30 border border-orange-200/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <p className="text-xs text-orange-700 font-medium">Fett</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {productData.fat}g
                  </p>
                </div>
              </motion.div>

              {/* Ingredients */}
              {(productData.ingredients || productData.ingredientsList?.length) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Zutaten
                    </h3>
                  </div>

                  {productData.ingredientsList && productData.ingredientsList.length > 0 ? (
                    <div className="space-y-2">
                      {productData.ingredientsList.map((ingredient, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + idx * 0.05 }}
                          className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50/40 border border-emerald-200/30"
                        >
                          <span className="text-xs font-bold text-emerald-500 mt-0.5">
                            •
                          </span>
                          <span className="text-sm text-emerald-800 flex-1">
                            {ingredient}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : productData.ingredients ? (
                    <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-200/30">
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        {productData.ingredients}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-2 pt-4"
              >
                {onAdd && (
                  <Button
                    onClick={() => {
                      onAdd();
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium"
                  >
                    Zum Tracker hinzufügen
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Schließen
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
