import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

interface LanguageSettingsProps {
  trigger?: React.ReactNode;
}

export const LanguageSettings = ({ trigger }: LanguageSettingsProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            {t.languageSettings}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t.changeLanguage}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {languages.map((lang) => (
            <Card
              key={lang.code}
              className={`p-4 cursor-pointer transition-all hover:bg-accent/50 ${
                language === lang.code
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              }`}
              onClick={() => setLanguage(lang.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                </div>
                {language === lang.code && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
