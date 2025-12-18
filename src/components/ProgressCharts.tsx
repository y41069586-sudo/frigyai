import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, Scale, Flame, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";

interface WeightData {
  date: string;
  weight: number;
  displayDate: string;
}

interface CalorieData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  displayDate: string;
}

interface WaterData {
  date: string;
  glasses: number;
  displayDate: string;
}

type TimeRange = "week" | "month" | "3months";

const ProgressCharts = () => {
  const { user } = useAuth();
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [waterData, setWaterData] = useState<WaterData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, timeRange]);

  const getDaysForRange = (): number => {
    switch (timeRange) {
      case "week": return 7;
      case "month": return 30;
      case "3months": return 90;
      default: return 7;
    }
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const days = getDaysForRange();
    const startDate = subDays(new Date(), days);
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

    try {
      // Load weight data
      const { data: weights } = await supabase
        .from("weight_entries")
        .select("weight, recorded_at")
        .eq("user_id", user.id)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true });

      const weightMap = new Map<string, number>();
      weights?.forEach(w => {
        const date = format(new Date(w.recorded_at), "yyyy-MM-dd");
        weightMap.set(date, Number(w.weight));
      });

      const formattedWeights: WeightData[] = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
          date: dateStr,
          weight: weightMap.get(dateStr) || 0,
          displayDate: format(date, "dd.MM", { locale: de })
        };
      }).filter(d => d.weight > 0);

      setWeightData(formattedWeights);

      // Load water data
      const { data: water } = await supabase
        .from("water_intake")
        .select("glasses, date")
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      const waterMap = new Map<string, number>();
      water?.forEach(w => {
        waterMap.set(w.date, w.glasses);
      });

      const formattedWater: WaterData[] = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
          date: dateStr,
          glasses: waterMap.get(dateStr) || 0,
          displayDate: format(date, "dd.MM", { locale: de })
        };
      });

      setWaterData(formattedWater);

      // Load calorie data from localStorage
      const foodLog = JSON.parse(localStorage.getItem("foodLog") || "[]");
      const calorieMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
      
      foodLog.forEach((entry: any) => {
        if (entry.date) {
          const existing = calorieMap.get(entry.date) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
          calorieMap.set(entry.date, {
            calories: existing.calories + (entry.calories || 0),
            protein: existing.protein + (entry.protein || 0),
            carbs: existing.carbs + (entry.carbs || 0),
            fat: existing.fat + (entry.fat || 0)
          });
        }
      });

      const formattedCalories: CalorieData[] = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const data = calorieMap.get(dateStr) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return {
          date: dateStr,
          ...data,
          displayDate: format(date, "dd.MM", { locale: de })
        };
      });

      setCalorieData(formattedCalories);
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeightTrend = () => {
    if (weightData.length < 2) return { icon: Minus, color: "text-muted-foreground", text: "Keine Daten" };
    const first = weightData[0].weight;
    const last = weightData[weightData.length - 1].weight;
    const diff = last - first;
    
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: "text-muted-foreground", text: "Stabil" };
    if (diff < 0) return { icon: TrendingDown, color: "text-primary", text: `${Math.abs(diff).toFixed(1)} kg verloren` };
    return { icon: TrendingUp, color: "text-destructive", text: `${diff.toFixed(1)} kg zugenommen` };
  };

  const weightTrend = getWeightTrend();
  const WeightIcon = weightTrend.icon;

  const avgCalories = calorieData.length > 0 
    ? Math.round(calorieData.reduce((sum, d) => sum + d.calories, 0) / calorieData.filter(d => d.calories > 0).length) || 0
    : 0;

  const avgWater = waterData.length > 0 
    ? (waterData.reduce((sum, d) => sum + d.glasses, 0) / waterData.filter(d => d.glasses > 0).length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-center">
        {(["week", "month", "3months"] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={timeRange === range ? "gradient-neon text-primary-foreground" : ""}
          >
            {range === "week" ? "7 Tage" : range === "month" ? "30 Tage" : "3 Monate"}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="weight" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Scale className="h-4 w-4 mr-1" />
            Gewicht
          </TabsTrigger>
          <TabsTrigger value="calories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Flame className="h-4 w-4 mr-1" />
            Kalorien
          </TabsTrigger>
          <TabsTrigger value="water" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Droplet className="h-4 w-4 mr-1" />
            Wasser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight">
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Gewichtsverlauf</h3>
              <div className={`flex items-center gap-1 text-sm ${weightTrend.color}`}>
                <WeightIcon className="h-4 w-4" />
                {weightTrend.text}
              </div>
            </div>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} kg`, 'Gewicht']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#weightGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Noch keine Gewichtsdaten vorhanden
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calories">
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Kalorienverlauf</h3>
              <div className="text-sm text-muted-foreground">
                Ø {avgCalories} kcal/Tag
              </div>
            </div>
            {calorieData.some(d => d.calories > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={calorieData}>
                  <defs>
                    <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        calories: 'Kalorien',
                        protein: 'Protein',
                        carbs: 'Kohlenhydrate',
                        fat: 'Fett'
                      };
                      return [`${value}${name === 'calories' ? ' kcal' : 'g'}`, labels[name] || name];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#calorieGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Noch keine Kaloriendaten vorhanden
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="water">
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Wasseraufnahme</h3>
              <div className="text-sm text-muted-foreground">
                Ø {avgWater} Gläser/Tag
              </div>
            </div>
            {waterData.some(d => d.glasses > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={waterData}>
                  <defs>
                    <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} Gläser`, 'Wasser']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="glasses" 
                    stroke="hsl(200, 100%, 50%)" 
                    fill="url(#waterGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Noch keine Wasserdaten vorhanden
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ProgressCharts;
