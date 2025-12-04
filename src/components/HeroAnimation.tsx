import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, HelpCircle, Utensils, Scale, ChefHat } from "lucide-react";

const HeroAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const fridgeOpen = step >= 1;

  return (
    <div className="relative w-full max-w-xl mx-auto h-96 md:h-[500px]">
      {/* Person/Stickfigure - LEFT SIDE */}
      <motion.div
        className="absolute left-[5%] md:left-[10%] top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Head */}
        <motion.div
          className="w-11 h-11 md:w-12 md:h-12 bg-primary/30 rounded-full border-2 border-primary flex items-center justify-center relative"
          animate={step === 0 ? { rotate: [0, -10, 10, -5, 0] } : {}}
          transition={{ duration: 1, repeat: step === 0 ? Infinity : 0, repeatDelay: 0.5 }}
        >
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
            <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
          </div>
          
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, rotate: [0, 15, -15, 10, 0] }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 0.8, repeat: Infinity } }}
                className="absolute -top-2 -right-1 w-5 h-5 bg-primary/40 rounded-full"
              />
            )}
          </AnimatePresence>
        </motion.div>

        <div className="w-1 h-14 md:h-16 bg-primary/50 mx-auto rounded-full" />
        
        <div className="absolute top-12 md:top-14 left-1/2 -translate-x-1/2 flex">
          <motion.div
            className="w-8 h-1 bg-primary/50 rounded-full origin-right"
            animate={step >= 1 ? { rotate: 50, x: 15 } : { rotate: -30 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="w-8 h-1 bg-primary/50 rounded-full origin-left"
            animate={step >= 1 ? { rotate: -50, x: -15 } : { rotate: 30 }}
            transition={{ duration: 0.3 }}
          />
        </div>

          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x: 25, y: -18 }}
                className="absolute top-10 right-0"
              >
                <div className="w-6 h-10 bg-card border-2 border-primary rounded-md flex items-center justify-center shadow-lg">
                  <Camera className="w-3 h-3 text-primary" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </motion.div>

      {/* Question marks */}
      <AnimatePresence>
        {step === 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute left-[2%] top-[22%]"
            >
              <HelpCircle className="w-6 h-6 text-primary/60" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute left-[8%] top-[15%]"
            >
              <HelpCircle className="w-5 h-5 text-primary/40" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FRIDGE - CENTER */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-56 md:w-52 md:h-72"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Fridge Interior */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100 dark:from-slate-200 dark:to-slate-300 rounded-xl shadow-inner overflow-hidden">
          {/* Shelves */}
          <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-slate-300" />
          <div className="absolute left-0 right-0 top-[50%] h-[2px] bg-slate-300" />
          <div className="absolute left-0 right-0 top-[75%] h-[2px] bg-slate-300" />
          
          {/* Food Items */}
          <AnimatePresence>
            {fridgeOpen && (
              <>
                {/* Top Shelf - Milk carton, Orange juice, Apple */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-[3%] left-[8%] w-6 h-12 md:w-8 md:h-14 rounded-sm shadow-md overflow-hidden"
                >
                  {/* Milk carton */}
                  <div className="w-full h-full bg-white border border-slate-200">
                    <div className="w-full h-3 bg-blue-400 rounded-t-sm" />
                    <div className="flex justify-center mt-1">
                      <div className="w-3 h-4 bg-blue-100 rounded-sm" />
                    </div>
                  </div>
                </motion.div>
                
                {/* Orange juice */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="absolute top-[4%] left-[35%] w-5 h-10 md:w-6 md:h-12 rounded-sm shadow-md overflow-hidden"
                >
                  <div className="w-full h-full bg-orange-400">
                    <div className="w-full h-2 bg-orange-600 rounded-t-sm" />
                    <div className="w-2 h-2 bg-orange-200 rounded-full mx-auto mt-1" />
                  </div>
                </motion.div>

                {/* Apple */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-[6%] right-[30%] w-5 h-5 md:w-6 md:h-6"
                >
                  <div className="w-full h-full bg-red-500 rounded-full shadow-md relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-amber-700 rounded-full" />
                    <div className="absolute top-0 right-1 w-2 h-2 bg-green-500 rounded-full transform -rotate-45" />
                  </div>
                </motion.div>

                {/* Eggs */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="absolute top-[5%] right-[8%] w-8 h-6 md:w-10 md:h-7 bg-amber-50 rounded border border-amber-100 shadow-sm flex items-center justify-center gap-0.5"
                >
                  <div className="w-2 h-3 bg-amber-100 rounded-full" />
                  <div className="w-2 h-3 bg-amber-100 rounded-full" />
                  <div className="w-2 h-3 bg-amber-100 rounded-full" />
                </motion.div>

                {/* Second Shelf - Vegetables */}
                {/* Carrot */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-[28%] left-[8%]"
                >
                  <div className="w-3 h-8 md:w-4 md:h-10 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full shadow-md relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-3 flex justify-center">
                      <div className="w-1 h-3 bg-green-500 rounded-full transform -rotate-12" />
                      <div className="w-1 h-3 bg-green-500 rounded-full" />
                      <div className="w-1 h-3 bg-green-500 rounded-full transform rotate-12" />
                    </div>
                  </div>
                </motion.div>

                {/* Tomato */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                  className="absolute top-[30%] left-[30%] w-5 h-5 md:w-7 md:h-7"
                >
                  <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-md relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-green-500 rounded-b-full" />
                  </div>
                </motion.div>

                {/* Avocado */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-[28%] right-[25%] w-5 h-7 md:w-6 md:h-8"
                >
                  <div className="w-full h-full bg-gradient-to-b from-green-600 to-green-800 rounded-full shadow-md" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
                </motion.div>

                {/* Cheese */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  className="absolute top-[30%] right-[5%] w-6 h-5 md:w-8 md:h-6"
                >
                  <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-sm shadow-md relative">
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-yellow-200 rounded-full" />
                    <div className="absolute bottom-1 right-2 w-1 h-1 bg-yellow-200 rounded-full" />
                  </div>
                </motion.div>

                {/* Third Shelf - Containers */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-[53%] left-[5%] w-10 h-6 md:w-14 md:h-8 bg-primary/20 rounded border border-primary/40 shadow-sm"
                >
                  <div className="w-full h-1.5 bg-primary/30 rounded-t" />
                </motion.div>
                
                {/* Yogurt */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 }}
                  className="absolute top-[54%] left-[45%] w-5 h-5 md:w-6 md:h-6"
                >
                  <div className="w-full h-full bg-white rounded-sm border border-slate-200 shadow-sm">
                    <div className="w-full h-1.5 bg-pink-400 rounded-t-sm" />
                  </div>
                </motion.div>

                {/* Broccoli */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-[53%] right-[8%] w-6 h-6 md:w-8 md:h-8"
                >
                  <div className="w-full h-full relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-green-700 rounded-sm" />
                    <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full" />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-600 rounded-full" />
                  </div>
                </motion.div>

                {/* Bottom Drawer - Mixed Veggies */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="absolute bottom-[2%] left-[4%] right-[4%] h-8 md:h-10 bg-gradient-to-b from-green-50 to-green-100 rounded border border-slate-200 flex items-center justify-around px-2"
                >
                  {/* Lettuce */}
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-green-300 to-green-500 rounded-full" />
                  {/* Pepper */}
                  <div className="w-3 h-5 md:w-4 md:h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-b-full rounded-t-sm" />
                  {/* Cucumber */}
                  <div className="w-2 h-5 md:w-3 md:h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                  {/* Lemon */}
                  <div className="w-4 h-3 md:w-5 md:h-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full" />
                  {/* Spinach */}
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Scan beam overlay on fridge */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Glowing scan line that sweeps up and down */}
              <motion.div
                className="absolute left-0 right-0 h-2 bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_20px_hsl(var(--primary)),0_0_40px_hsl(var(--primary)/0.5)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Scan overlay glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {/* Horizontal scan lines */}
              <div 
                className="absolute inset-0"
                style={{ 
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 4px, hsl(var(--primary) / 0.1) 4px, hsl(var(--primary) / 0.1) 5px)'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-400 dark:via-slate-300 dark:to-slate-400 rounded-xl border-2 border-slate-300 shadow-xl origin-right"
          animate={{
            rotateY: fridgeOpen ? 110 : 0,
          }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Door Handle */}
          <div className="absolute left-3 top-[45%] w-2 h-10 md:h-12 bg-slate-400 rounded-full shadow-inner" />
          
          {/* Freezer Line */}
          <div className="absolute left-0 right-0 top-[25%] h-[3px] bg-slate-300" />
          
          {/* Door Texture */}
          <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-white/30 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Recipe Cards - RIGHT SIDE */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-[2%] md:right-[5%] top-[15%] flex flex-col gap-2"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-20 md:w-24 p-2 bg-card border-2 border-primary/50 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-1 mb-1">
                <Utensils className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold">Rezept 1</span>
              </div>
              <span className="text-[8px] text-primary font-semibold">350 kcal</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-20 md:w-24 p-2 bg-card border-2 border-primary/50 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-1 mb-1">
                <ChefHat className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold">Rezept 2</span>
              </div>
              <span className="text-[8px] text-primary font-semibold">280 kcal</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Loss Badge - VISIBLE POSITION */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-[25%] bottom-[8%]"
          >
            <div className="flex items-center gap-1.5 bg-primary/20 px-3 py-1.5 rounded-full border border-primary/50 shadow-lg">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">-3kg</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HeroAnimation;
