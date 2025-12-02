import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, ChefHat, Sparkles } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Card } from '@/components/ui/card';

const MealPlansPage = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!subscriptionStatus?.subscribed) {
      navigate('/premium');
    }
  }, [user, subscriptionStatus, navigate]);

  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  const mockMealPlan = [
    { day: 'Montag', meals: ['Hühnchen-Bowl', 'Protein-Shake', 'Lachs mit Gemüse'] },
    { day: 'Dienstag', meals: ['Griechischer Joghurt', 'Quinoa-Salat', 'Puten-Wrap'] },
    { day: 'Mittwoch', meals: ['Omelett', 'Thunfisch-Salat', 'Rindfleisch-Pfanne'] },
    { day: 'Donnerstag', meals: ['Protein-Pancakes', 'Hähnchen-Salat', 'Garnelen-Bowl'] },
    { day: 'Freitag', meals: ['Avocado-Toast', 'Linsen-Suppe', 'Hähnchen-Curry'] },
    { day: 'Samstag', meals: ['Smoothie-Bowl', 'Buddha-Bowl', 'Steak mit Salat'] },
    { day: 'Sonntag', meals: ['French-Toast', 'Caesar-Salat', 'Lachs-Teriyaki'] },
  ];

  return (
    <div className="min-h-screen bg-gradient-primary">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <NavLink to="/">
            <h1 className="text-2xl font-bold neon-text">Healthy3</h1>
          </NavLink>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-medium">Premium</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold neon-text mb-2">Dein Wochenplan</h2>
              <p className="text-muted-foreground">Personalisierte Rezepte für die ganze Woche</p>
            </div>
            <Button className="glow-button">
              <Calendar className="mr-2 h-5 w-5" />
              Neue Woche generieren
            </Button>
          </div>

          <div className="grid gap-4">
            {mockMealPlan.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 bg-card/80 backdrop-blur-lg border-primary/20 hover:shadow-neon transition-all duration-300">
                  <h3 className="text-xl font-bold mb-4 text-primary">{day.day}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {day.meals.map((meal, mealIndex) => (
                      <div
                        key={mealIndex}
                        className="p-4 bg-background/50 rounded-xl flex items-center space-x-3"
                      >
                        <ChefHat className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {mealIndex === 0 ? 'Frühstück' : mealIndex === 1 ? 'Mittagessen' : 'Abendessen'}
                          </p>
                          <p className="font-medium">{meal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MealPlansPage;