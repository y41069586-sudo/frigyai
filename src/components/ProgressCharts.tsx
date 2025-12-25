import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Scale, Flame, Droplet, ChevronRight } from "lucide-react";
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
type ChartType = "weight" | "calories" | "water";

// Clean minimal tooltip
const CleanTooltip = ({ active, payload, suffix }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-foreground text-background px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium"
      >
        {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}
        <span className="opacity-70 ml-1">{suffix}</span>
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
  const [activeChart, setActiveChart] = useState<ChartType>("weight");
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
    if (weightData.length < 2) return { icon: Minus, color: "text-muted-foreground", value: "--" };
    const first = weightData[0].weight;
    const last = weightData[weightData.length - 1].weight;
    const diff = last - first;
    
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: "text-muted-foreground", value: "0" };
    if (diff < 0) return { icon: TrendingDown, color: "text-emerald-500", value: `${Math.abs(diff).toFixed(1)}` };
    return { icon: TrendingUp, color: "text-amber-500", value: `+${diff.toFixed(1)}` };
  };

  const weightTrend = getWeightTrend();
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;

  const chartConfigs = {
    weight: {
      label: "Gewicht",
      icon: Scale,
      color: "#10b981",
      data: weightData,
      dataKey: "weight",
      suffix: "kg",
      hasData: weightData.length > 0
    },
    calories: {
      label: "Kalorien",
      icon: Flame,
      color: "#f59e0b",
      data: calorieData,
      dataKey: "calories",
      suffix: "kcal",
      hasData: calorieData.some(d => d.calories > 0)
    },
    water: {
      label: "Wasser",
      icon: Droplet,
      color: "#3b82f6",
      data: waterData,
      dataKey: "glasses",
      suffix: "Gläser",
      hasData: waterData.some(d => d.glasses > 0)
    }
  };

  const currentConfig = chartConfigs[activeChart];

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border/30">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-muted/50 rounded w-24" />
          <div className="h-48 bg-muted/30 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Chart Card */}
      <Card className="p-5 bg-card border-border/30 rounded-2xl overflow-hidden">
        {/* Header with stats */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <currentConfig.icon className="h-4 w-4" style={{ color: currentConfig.color }} />
              <span>{currentConfig.label}</span>
            </div>
            {activeChart === "weight" && latestWeight && (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{latestWeight.toFixed(1)}</span>
                <span className="text-lg text-muted-foreground">kg</span>
              </div>
            )}
          </div>
          
          {activeChart === "weight" && (
            <div className={`flex items-center gap-1 text-sm font-medium ${weightTrend.color} px-2.5 py-1 rounded-full bg-muted/30`}>
              <weightTrend.icon className="h-3.5 w-3.5" />
              <span>{weightTrend.value} kg</span>
            </div>
          )}
        </div>

        {/* Chart */}
        {currentConfig.hasData ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={currentConfig.data} 
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.3}
                  vertical={false}
                />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={45}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CleanTooltip suffix={currentConfig.suffix} />} />
                <Line 
                  type="monotone"
                  dataKey={currentConfig.dataKey} 
                  stroke={currentConfig.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ 
                    r: 5, 
                    fill: currentConfig.color,
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2
                  }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
            Noch keine Daten vorhanden
          </div>
        )}

        {/* Time Range Pills */}
        <div className="flex gap-2 mt-4 justify-center">
          {(["week", "month", "3months"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                timeRange === range 
                  ? "bg-foreground text-background" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {range === "week" ? "7T" : range === "month" ? "30T" : "3M"}
            </button>
          ))}
        </div>
      </Card>

      {/* Chart Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(chartConfigs) as ChartType[]).map((type) => {
          const config = chartConfigs[type];
          const isActive = activeChart === type;
          const Icon = config.icon;
          
          return (
            <button
              key={type}
              onClick={() => setActiveChart(type)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-card border-2 shadow-sm" 
                  : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
              }`}
              style={{ borderColor: isActive ? config.color : 'transparent' }}
            >
              <Icon 
                className="h-5 w-5" 
                style={{ color: isActive ? config.color : 'hsl(var(--muted-foreground))' }}
              />
              <span className={`text-xs font-medium ${isActive ? '' : 'text-muted-foreground'}`}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProgressCharts;
