import { motion } from "framer-motion";
import { Star, User } from "lucide-react";
import { StepCard } from "../components";

export const SocialProofStep = () => {
  const testimonials = [
    { name: "Sarah M.", text: "8kg in 2 Monaten verloren!", color: "from-pink-500/20 to-rose-500/20", rating: 5 },
    { name: "Thomas K.", text: "Endlich meine Makros im Griff!", color: "from-blue-500/20 to-cyan-500/20", rating: 5 },
    { name: "Lisa R.", text: "Beste Meal-Planning App ever", color: "from-purple-500/20 to-pink-500/20", rating: 5 },
  ];

  return (
    <StepCard step="social-proof">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
        >
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ))}
          </div>
          <span className="font-bold text-lg">4.9</span>
        </motion.div>
        
        <motion.h1 
          className="text-2xl font-bold mb-1" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Tausende lieben Frigy
        </motion.h1>
        <motion.p 
          className="text-muted-foreground/50 text-xs mb-6" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          Schließe dich 50.000+ zufriedenen Nutzern an
        </motion.p>
        
        <div className="w-full max-w-sm space-y-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center`}>
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground/60">&quot;{testimonial.text}&quot;</p>
              </div>
              <div className="flex text-yellow-500">
                {Array.from({ length: testimonial.rating }).map((_, idx) => (
                  <Star key={idx} className="w-3 h-3 fill-yellow-500" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </StepCard>
  );
};
