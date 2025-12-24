import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, Scale, Flame, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, eachDayOfInterval } from "date-fns";
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

// Custom smooth tooltip
const CustomTooltip = ({ active, payload, label, suffix }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl px-4 py-3 shadow-2xl"
      >
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold text-foreground">
          {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}
          <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>
        </p>
      </motion.div>
    );
  }
  return null;
};

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
    if (diff < 0) return { icon: TrendingDown, color: "text-emerald-500", text: `${Math.abs(diff).toFixed(1)} kg verloren` };
    return { icon: TrendingUp, color: "text-amber-500", text: `${diff.toFixed(1)} kg zugenommen` };
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
      <Card className="p-6 bg-card/80 backdrop-blur-xl border-border/30 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/50 rounded-full w-1/3" />
          <div className="h-52 bg-muted/30 rounded-2xl" />
        </div>
      </Card>
    );
  }

  const renderChart = (
    data: any[], 
    dataKey: string, 
    gradientId: string, 
    strokeColor: string,
    gradientColors: [string, string],
    suffix: string
  ) => (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={0.5} />
            <stop offset="50%" stopColor={gradientColors[0]} stopOpacity={0.2} />
            <stop offset="100%" stopColor={gradientColors[1]} stopOpacity={0} />
          </linearGradient>
          <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <XAxis 
          dataKey="displayDate" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, dy: 8 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          domain={['dataMin - 1', 'dataMax + 1']} 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, dx: -5 }}
          width={40}
        />
        <Tooltip content={<CustomTooltip suffix={suffix} />} />
        <Area 
          type="natural"
          dataKey={dataKey} 
          stroke={strokeColor}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ 
            r: 6, 
            fill: strokeColor,
            stroke: 'hsl(var(--background))',
            strokeWidth: 3,
            filter: `url(#glow-${gradientId})`
          }}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-center p-1 bg-muted/30 rounded-xl w-fit mx-auto">
        {(["week", "month", "3months"] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={`px-4 h-9 rounded-lg font-medium transition-all duration-300 ${
              timeRange === range 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                : "hover:bg-muted/50"
            }`}
          >
            {range === "week" ? "7 Tage" : range === "month" ? "30 Tage" : "3 Monate"}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl h-12">
          <TabsTrigger 
            value="weight" 
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300"
          >
            <Scale className="h-4 w-4 mr-2" />
            Gewicht
          </TabsTrigger>
          <TabsTrigger 
            value="calories" 
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300"
          >
            <Flame className="h-4 w-4 mr-2" />
            Kalorien
          </TabsTrigger>
          <TabsTrigger 
            value="water" 
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300"
          >
            <Droplet className="h-4 w-4 mr-2" />
            Wasser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="mt-4">
          <Card className="p-5 bg-card/60 backdrop-blur-xl border-border/20 shadow-xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Gewichtsverlauf</h3>
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-1.5 text-sm font-medium ${weightTrend.color} bg-background/50 px-3 py-1.5 rounded-full`}
              >
                <WeightIcon className="h-4 w-4" />
                {weightTrend.text}
              </motion.div>
            </div>
            {weightData.length > 0 ? (
              renderChart(weightData, 'weight', 'weightGradient', '#10b981', ['#10b981', '#34d399'], 'kg')
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground">
                Noch keine Gewichtsdaten vorhanden
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calories" className="mt-4">
          <Card className="p-5 bg-card/60 backdrop-blur-xl border-border/20 shadow-xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Kalorienverlauf</h3>
              <div className="text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                Ø {avgCalories} kcal/Tag
              </div>
            </div>
            {calorieData.some(d => d.calories > 0) ? (
              renderChart(calorieData, 'calories', 'calorieGradient', '#f59e0b', ['#f59e0b', '#fbbf24'], 'kcal')
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground">
                Noch keine Kaloriendaten vorhanden
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="water" className="mt-4">
          <Card className="p-5 bg-card/60 backdrop-blur-xl border-border/20 shadow-xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Wasseraufnahme</h3>
              <div className="text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                Ø {avgWater} Gläser/Tag
              </div>
            </div>
            {waterData.some(d => d.glasses > 0) ? (
              renderChart(waterData, 'glasses', 'waterGradient', '#3b82f6', ['#3b82f6', '#60a5fa'], 'Gläser')
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground">
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
