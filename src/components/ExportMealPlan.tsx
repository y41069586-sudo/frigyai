import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { getLocalDateISO } from '@/lib/localDate';

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
  /** Nur PDF (kein Text-/Kalender-Export) – z. B. kompakte Toolbar */
  pdfOnly?: boolean;
}

export const ExportMealPlan = ({ mealPlan, pdfOnly = false }: ExportMealPlanProps) => {
  const { language } = useLanguage();
  const hasMealPlan = mealPlan.length > 0;
  const copy = language === 'fr'
    ? {
        popupBlocked: 'Popup bloque',
        popupBlockedDesc: 'Autorise les popups pour exporter.',
        pdfExport: 'Export PDF',
        printOpened: 'La fenetre d impression a ete ouverte',
        exported: 'Exporte !',
        textSaved: 'Plan hebdomadaire enregistre en texte',
        calendarExport: 'Export calendrier',
        calendarHint: 'Ouvre le fichier .ics dans ton calendrier',
        printTitle: 'Plan hebdomadaire - Frigy',
        heading: 'Plan hebdomadaire',
        ingredients: 'Ingredients',
        printPdf: 'Imprimer en PDF',
        text: 'Texte',
        calendar: 'Calendrier',
        weekPlanFile: 'plan-hebdomadaire',
      }
    : language === 'en'
      ? {
          popupBlocked: 'Popup blocked',
          popupBlockedDesc: 'Please allow popups for export.',
          pdfExport: 'PDF export',
          printOpened: 'Print dialog opened',
          exported: 'Exported!',
          textSaved: 'Weekly plan saved as text',
          calendarExport: 'Calendar export',
          calendarHint: 'Open the .ics file in your calendar app',
          printTitle: 'Weekly Plan - Frigy',
          heading: 'Weekly Plan',
          ingredients: 'Ingredients',
          printPdf: 'Print as PDF',
          text: 'Text',
          calendar: 'Calendar',
          weekPlanFile: 'weekly-plan',
        }
      : {
          popupBlocked: 'Popup blockiert',
          popupBlockedDesc: 'Bitte erlaube Popups fuer den Export',
          pdfExport: 'PDF Export',
          printOpened: 'Druckdialog geoeffnet',
          exported: 'Exportiert!',
          textSaved: 'Wochenplan als Text gespeichert',
          calendarExport: 'Kalender Export',
          calendarHint: 'Oeffne die .ics Datei mit deinem Kalender',
          printTitle: 'Wochenplan - Frigy',
          heading: 'Wochenplan',
          ingredients: 'Zutaten',
          printPdf: 'Als PDF drucken',
          text: 'Text',
          calendar: 'Kalender',
          weekPlanFile: 'wochenplan',
        };

  const exportToPDF = () => {
    if (!hasMealPlan) return;
    // Create printable HTML
    const content = generatePrintContent();
    
    // Open new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: copy.popupBlocked, description: copy.popupBlockedDesc, variant: 'destructive' });
      return;
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast({ title: copy.pdfExport, description: copy.printOpened });
  };

  const exportToText = () => {
    let text = `🥗 ${copy.heading.toUpperCase()}\n`;
    text += '═'.repeat(40) + '\n\n';

    mealPlan.forEach(day => {
      text += `📅 ${day.day.toUpperCase()}\n`;
      text += '─'.repeat(30) + '\n';
      
      day.meals.forEach(meal => {
        text += `\n${meal.type}: ${meal.name}\n`;
        text += `  ⚡ ${meal.calories} kcal | 🥩 ${meal.protein}g P | 🍞 ${meal.carbs}g K | 🥑 ${meal.fat}g F\n`;
        text += `  ⏱️ ${meal.prepTime} Min\n`;
        text += `  ${copy.ingredients}: ${meal.ingredients.map(i => `${i.name} (${i.amount})`).join(', ')}\n`;
      });
      
      text += '\n';
    });

    // Create download
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${copy.weekPlanFile}-${getLocalDateISO()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: copy.exported, description: copy.textSaved });
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
    
    toast({ title: copy.calendarExport, description: copy.calendarHint });
  };

  const generatePrintContent = () => {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${copy.printTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333; }
    h1 { text-align: center; color: #33FF99; margin-bottom: 20px; }
    .day { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
    .day-title { font-size: 18px; font-weight: bold; color: #33FF99; margin-bottom: 12px; border-bottom: 2px solid #33FF99; padding-bottom: 8px; }
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
  <h1>🥗 ${copy.heading}</h1>
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

  if (pdfOnly) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={!hasMealPlan}
        className="hover:border-primary h-11 shrink-0 gap-1.5 rounded-2xl border-primary/25 bg-white px-3 sm:h-10"
        title={copy.printPdf}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">PDF</span>
      </Button>
    );
  }

  if (!hasMealPlan) return null;

  return (
    <div className="flex gap-1.5 sm:gap-2">
      <Button variant="outline" size="sm" onClick={exportToPDF} className="hover:border-primary px-2 sm:px-3">
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">PDF</span>
      </Button>
      <Button variant="outline" size="sm" onClick={exportToText} className="hover:border-primary px-2 sm:px-3">
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">{copy.text}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={addToCalendar} className="hover:border-primary px-2 sm:px-3">
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">{copy.calendar}</span>
      </Button>
    </div>
  );
};
