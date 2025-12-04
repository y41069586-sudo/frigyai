import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Ingredient {
  name: string;
  amount: string;
  price: number;
}

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: Ingredient[];
  instructions: string[];
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

interface ExportMealPlanProps {
  mealPlan: DayPlan[];
}

export const ExportMealPlan = ({ mealPlan }: ExportMealPlanProps) => {
  const exportToPDF = () => {
    // Create printable HTML
    const content = generatePrintContent();
    
    // Open new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Popup blockiert', description: 'Bitte erlaube Popups für den Export', variant: 'destructive' });
      return;
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast({ title: 'PDF Export', description: 'Druckdialog geöffnet' });
  };

  const exportToText = () => {
    let text = '🥗 WOCHENPLAN\n';
    text += '═'.repeat(40) + '\n\n';

    mealPlan.forEach(day => {
      text += `📅 ${day.day.toUpperCase()}\n`;
      text += '─'.repeat(30) + '\n';
      
      day.meals.forEach(meal => {
        text += `\n${meal.type}: ${meal.name}\n`;
        text += `  ⚡ ${meal.calories} kcal | 🥩 ${meal.protein}g P | 🍞 ${meal.carbs}g K | 🥑 ${meal.fat}g F\n`;
        text += `  ⏱️ ${meal.prepTime} Min\n`;
        text += `  Zutaten: ${meal.ingredients.map(i => `${i.name} (${i.amount})`).join(', ')}\n`;
      });
      
      text += '\n';
    });

    // Create download
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wochenplan-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Exportiert!', description: 'Wochenplan als Text gespeichert' });
  };

  const addToCalendar = () => {
    // Generate iCal format
    let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Healthy3//Meal Plan//DE\n';
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    const mealTimes: Record<string, { hour: number; minute: number }> = {
      'Frühstück': { hour: 8, minute: 0 },
      'Snack': { hour: 10, minute: 30 },
      'Mittagessen': { hour: 12, minute: 30 },
      'Abendessen': { hour: 18, minute: 30 },
    };

    mealPlan.forEach((day, dayIndex) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIndex);

      day.meals.forEach(meal => {
        const time = mealTimes[meal.type] || { hour: 12, minute: 0 };
        const startDate = new Date(date);
        startDate.setHours(time.hour, time.minute, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + meal.prepTime + 30);

        const formatDate = (d: Date) => 
          d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        ical += `BEGIN:VEVENT\n`;
        ical += `DTSTART:${formatDate(startDate)}\n`;
        ical += `DTEND:${formatDate(endDate)}\n`;
        ical += `SUMMARY:${meal.type}: ${meal.name}\n`;
        ical += `DESCRIPTION:${meal.calories} kcal | ${meal.protein}g Protein\\nZutaten: ${meal.ingredients.map(i => i.name).join(', ')}\n`;
        ical += `END:VEVENT\n`;
      });
    });

    ical += 'END:VCALENDAR';

    // Download iCal file
    const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthy3-wochenplan.ics`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Kalender Export', description: 'Öffne die .ics Datei mit deinem Kalender' });
  };

  const generatePrintContent = () => {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Wochenplan - Healthy3</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333; }
    h1 { text-align: center; color: #00FF88; margin-bottom: 20px; }
    .day { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
    .day-title { font-size: 18px; font-weight: bold; color: #00FF88; margin-bottom: 12px; border-bottom: 2px solid #00FF88; padding-bottom: 8px; }
    .meals { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .meal { background: #f9f9f9; border-radius: 6px; padding: 12px; }
    .meal-type { font-size: 11px; color: #666; text-transform: uppercase; }
    .meal-name { font-weight: 600; margin: 4px 0; }
    .meal-macros { font-size: 11px; color: #555; }
    .meal-ingredients { font-size: 10px; color: #777; margin-top: 6px; }
    @media print {
      .day { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>🥗 Wochenplan</h1>
  ${mealPlan.map(day => `
    <div class="day">
      <div class="day-title">${day.day}</div>
      <div class="meals">
        ${day.meals.map(meal => `
          <div class="meal">
            <div class="meal-type">${meal.type}</div>
            <div class="meal-name">${meal.name}</div>
            <div class="meal-macros">${meal.calories} kcal • ${meal.protein}g P • ${meal.carbs}g K • ${meal.fat}g F</div>
            <div class="meal-ingredients">${meal.ingredients.map(i => `${i.name} (${i.amount})`).join(', ')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
</body>
</html>`;
  };

  if (mealPlan.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportToPDF} className="hover:border-primary">
        <FileText className="h-4 w-4 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportToText} className="hover:border-primary">
        <Download className="h-4 w-4 mr-1" /> Text
      </Button>
      <Button variant="outline" size="sm" onClick={addToCalendar} className="hover:border-primary">
        <Calendar className="h-4 w-4 mr-1" /> Kalender
      </Button>
    </div>
  );
};
