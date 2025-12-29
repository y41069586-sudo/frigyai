import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface FridgeScanAnimationProps {
  autoOpen?: boolean;
  autoOpenDelay?: number;
}

export default function FridgeScanAnimation({ 
  autoOpen = true, 
  autoOpenDelay = 800 
}: FridgeScanAnimationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => setOpen(true), autoOpenDelay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, autoOpenDelay]);

  return (
    <div className="relative w-[260px] h-[360px]">
      {/* FRIGY HEAD */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full z-[3]"
        style={{ background: "#7ED6A7" }}
      >
        {/* Eyes */}
        <div 
          className="absolute w-2.5 h-2.5 rounded-full bg-black"
          style={{ top: 45, left: 35 }}
        />
        <div 
          className="absolute w-2.5 h-2.5 rounded-full bg-black"
          style={{ top: 45, right: 35 }}
        />
        {/* Smile - appears when open */}
        <motion.div
          animate={{ 
            scaleX: open ? 1 : 0.6,
            opacity: open ? 1 : 0.5
          }}
          className="absolute w-8 h-4 border-b-[3px] border-black rounded-b-full"
          style={{ bottom: 30, left: '50%', transform: 'translateX(-50%)' }}
        />
      </motion.div>

      {/* ARM - attached to body, reaches for handle */}
      <motion.div
        initial={{ rotate: 15, x: -60 }}
        animate={{
          rotate: open ? -25 : 15,
          x: open ? -40 : -60,
          y: open ? 20 : 0,
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute z-[2]"
        style={{
          top: 130,
          left: '50%',
          transformOrigin: "top center",
        }}
      >
        {/* Upper arm */}
        <div 
          className="w-[18px] h-[70px] rounded-xl"
          style={{ background: "#7ED6A7" }}
        />
        {/* Hand */}
        <motion.div
          animate={{ rotate: open ? 20 : 0 }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          style={{ background: "#7ED6A7" }}
        />
      </motion.div>

      {/* FRIDGE BODY */}
      <div
        className="absolute bottom-0 w-full h-[220px] rounded-[20px] overflow-hidden"
        style={{ background: "#E6ECE9" }}
      >
        {/* Interior shelves (visible when door opens) */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          <div className="h-[2px] bg-gray-300 rounded mt-6" />
          <div className="h-[2px] bg-gray-300 rounded" />
          <div className="h-[2px] bg-gray-300 rounded mb-6" />
        </div>

        {/* Food items inside */}
        <motion.div 
          className="absolute inset-0 p-4 flex flex-wrap gap-2 items-center justify-center"
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-6 h-8 rounded bg-red-400" />
          <div className="w-8 h-6 rounded bg-yellow-400" />
          <div className="w-5 h-10 rounded bg-green-500" />
          <div className="w-7 h-7 rounded-full bg-orange-400" />
          <div className="w-6 h-8 rounded bg-blue-300" />
          <div className="w-8 h-5 rounded bg-purple-300" />
        </motion.div>

        {/* DOOR */}
        <motion.div
          onClick={() => setOpen(!open)}
          animate={{ rotateY: open ? -70 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute left-0 top-0 w-full h-full cursor-pointer"
          style={{
            background: "#FFFFFF",
            transformOrigin: "left center",
            transformStyle: "preserve-3d",
            boxShadow: open ? "10px 0 20px rgba(0,0,0,0.1)" : "none",
          }}
        >
          {/* Door surface details */}
          <div className="absolute inset-3 border border-gray-100 rounded-lg" />
          
          {/* HANDLE */}
          <div
            className="absolute right-3 rounded"
            style={{
              width: 8,
              height: 40,
              background: "#B0B8B4",
              top: "40%",
            }}
          />
        </motion.div>

        {/* SCAN EFFECT */}
        {open && (
          <motion.div
            initial={{ y: -220 }}
            animate={{ y: 220 }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "linear",
              repeatDelay: 0.3
            }}
            className="absolute w-full h-10 pointer-events-none z-10"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(126,214,167,0.5), transparent)",
            }}
          />
        )}
      </div>

      {/* Sparkles when scanning */}
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            className="absolute top-32 right-0 text-xl"
          >
            ✨
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            className="absolute top-48 -right-4 text-lg"
          >
            ✨
          </motion.div>
        </>
      )}
    </div>
  );
}