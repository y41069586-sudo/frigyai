import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Camera,
  Flame,
  Droplets,
  TrendingDown,
  Users,
  Apple,
  Activity,
  ChevronRight,
  Star,
  Check,
  Zap,
  Heart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import frigLogo from "@/assets/frigy-mascot.png";
import { useLanguage } from "@/contexts/LanguageContext";

export const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = useMemo(
    () => [
      { icon: Camera, title: t.landingFeatureScanTitle, description: t.landingFeatureScanDesc },
      { icon: Flame, title: t.landingFeatureCaloriesTitle, description: t.landingFeatureCaloriesDesc },
      { icon: TrendingDown, title: t.landingFeatureWeightTitle, description: t.landingFeatureWeightDesc },
      { icon: Droplets, title: t.landingFeatureWaterTitle, description: t.landingFeatureWaterDesc },
      { icon: Users, title: t.landingFeatureCommunityTitle, description: t.landingFeatureCommunityDesc },
      { icon: Activity, title: t.landingFeatureHealthTitle, description: t.landingFeatureHealthDesc },
    ],
    [t],
  );

  const testimonials = useMemo(
    () => [
      { name: "Sarah M.", text: t.landingTestimonial1, rating: 5 },
      { name: "Thomas K.", text: t.landingTestimonial2, rating: 5 },
      { name: "Lisa W.", text: t.landingTestimonial3, rating: 5 },
    ],
    [t],
  );

  const premiumFeatures = useMemo(
    () => [
      t.landingPremiumFeature1,
      t.landingPremiumFeature2,
      t.landingPremiumFeature3,
      t.landingPremiumFeature4,
      t.landingPremiumFeature5,
      t.landingPremiumFeature6,
      t.landingPremiumFeature7,
      t.landingPremiumFeature8,
    ],
    [t],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50" />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <img src={frigLogo} alt="Frigy" className="h-16" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {t.landingHeroTitle}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t.landingHeroSubtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {t.landingStartFreeBtn}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              {t.landingSignInBtn}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative max-w-sm mx-auto"
          >
            <div className="bg-gradient-to-br from-card to-card/80 rounded-3xl p-6 shadow-2xl border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t.landingPreviewScanned}</p>
                  <p className="text-sm text-muted-foreground">{t.landingPreviewRecipesFound}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landingFeaturesHeading}</h2>
            <p className="text-muted-foreground">{t.landingFeaturesSubheading}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow bg-card/50 backdrop-blur border-border/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landingPremiumHeading}</h2>
            <p className="text-muted-foreground">{t.landingPremiumSubheading}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="p-8 h-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {t.landingPopularBadge}
              </div>
              <h3 className="text-xl font-bold mb-6">{t.premium}</h3>
              <ul className="space-y-3 mb-8">
                {premiumFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                <Zap className="mr-2 h-4 w-4" />
                {t.landingPremiumDiscover}
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landingTestimonialsHeading}</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-4">&quot;{testimonial.text}&quot;</p>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-t from-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landingAppStoreHeading}</h2>
            <p className="text-muted-foreground mb-8">{t.landingAppStoreSubheading}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" className="gap-2" disabled>
                <Apple className="h-5 w-5" />
                {t.landingAppStoreSoon}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" disabled>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                {t.landingPlayStoreSoon}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">{t.landingCtaHeading}</h2>
            <p className="text-muted-foreground mb-8">{t.landingCtaSubheading}</p>
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              <Sparkles className="mr-2 h-5 w-5" />
              {t.startNow}
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <img src={frigLogo} alt="Frigy" className="h-8" />
          <p className="text-sm text-muted-foreground">{t.landingFooterRights}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
