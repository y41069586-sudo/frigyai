import { motion } from "framer-motion";
import { useState } from "react";

const HeroAnimationCompact = () => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        height: "100%",
        minHeight: 280,
        background: "linear-gradient(#ffffff, #f2f5f3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
      }}
    >
      {/* SCENE */}
      <div style={{ position: "relative", width: 200, height: 280 }}>
        {/* FRIGY HEAD */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "#7ED6A7",
            position: "absolute",
            top: -15,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
          }}
        >
          {/* Eyes */}
          <div style={{ position: "absolute", top: 35, left: 26, width: 8, height: 8, borderRadius: "50%", background: "#000" }} />
          <div style={{ position: "absolute", top: 35, right: 26, width: 8, height: 8, borderRadius: "50%", background: "#000" }} />
        </motion.div>

        {/* FRIDGE */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 220,
            background: "#E4ECE8",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {/* FREEZER WITH FACE */}
          <div
            style={{
              height: 60,
              background: "#D6DFDA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <motion.div
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              style={{ width: 8, height: 8, background: "#000", borderRadius: "50%" }}
            />
            <motion.div
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 4, delay: 0.2 }}
              style={{ width: 8, height: 8, background: "#000", borderRadius: "50%" }}
            />
          </div>

          {/* DOOR + ARM GROUP */}
          <motion.div
            onClick={() => setOpen(true)}
            animate={{ rotateY: open ? -65 : 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: 160,
              background: "#FFFFFF",
              transformOrigin: "left center",
              cursor: "pointer",
            }}
          >
            {/* HANDLE */}
            <div
              style={{
                width: 6,
                height: 30,
                background: "#B0B8B4",
                borderRadius: 3,
                position: "absolute",
                right: 10,
                top: "40%",
              }}
            />

            {/* ARM ATTACHED TO DOOR */}
            <div
              style={{
                position: "absolute",
                left: -14,
                top: 40,
                width: 14,
                height: 80,
                background: "#7ED6A7",
                borderRadius: 10,
              }}
            />

            {/* HAND */}
            <div
              style={{
                position: "absolute",
                left: -20,
                top: 105,
                width: 28,
                height: 20,
                background: "#7ED6A7",
                borderRadius: 10,
              }}
            />
          </motion.div>

          {/* SCAN LIGHT */}
          {open && (
            <motion.div
              initial={{ y: -160 }}
              animate={{ y: 160 }}
              transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
              style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                height: 30,
                background: "rgba(126,214,167,0.35)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroAnimationCompact;