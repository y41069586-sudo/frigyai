import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isReferralAdmin } from "@/lib/admin";

const LIFETIME_DAYS = 0;

type ReferralCodeRow = {
  id: string;
  code: string;
  influencer_name: string | null;
  duration_days: number;
  max_redemptions: number | null;
  redemption_count: number;
  active: boolean;
};

function formatDuration(days: number): string {
  return days === LIFETIME_DAYS ? "Lebenslang" : days + "d";
}

export function ReferralCodesAdmin() {
  const { user, session } = useAuth();
  const [codes, setCodes] = useState<ReferralCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const invoke = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("manage-referral-codes", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    [session?.access_token],
  );

  const loadCodes = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await invoke({ action: "list" });
      setCodes((data?.codes as ReferralCodeRow[]) ?? []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Laden fehlgeschlagen";
      toast({ title: "Fehler", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [invoke, session?.access_token]);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  if (!isReferralAdmin(user?.email)) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = newCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (normalized.length !== 6) {
      toast({ title: "Code braucht genau 6 Zeichen", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      await invoke({
        action: "create",
        code: normalized,
        influencer_name: influencerName.trim() || null,
        duration_days: durationDays,
        lifetime: durationDays === LIFETIME_DAYS,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
      });
      toast({ title: "Code erstellt", description: normalized });
      setNewCode("");
      setInfluencerName("");
      setMaxRedemptions("");
      await loadCodes();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erstellen fehlgeschlagen";
      toast({ title: "Fehler", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await invoke({ action: "toggle", id, active: !active });
      await loadCodes();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Aktualisieren fehlgeschlagen";
      toast({ title: "Fehler", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        <h4 className="text-sm font-semibold">Empfehlungscodes</h4>
      </div>

      <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="ref-code" className="text-xs">
              Code (6 Zeichen)
            </Label>
            <Input
              id="ref-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="SARAH1"
              className="h-10 font-mono uppercase tracking-widest"
              maxLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref-name" className="text-xs">
              Influencer
            </Label>
            <Input
              id="ref-name"
              value={influencerName}
              onChange={(e) => setInfluencerName(e.target.value)}
              placeholder="Name"
              className="h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { days: 30, label: "30d" },
              { days: 90, label: "90d" },
              { days: 365, label: "1J" },
              { days: LIFETIME_DAYS, label: "∞", title: "Lebenslang" },
            ] as const
          ).map(({ days, label, title }) => (
            <Button
              key={days}
              type="button"
              variant={durationDays === days ? "default" : "outline"}
              size="sm"
              title={title}
              className="h-8 min-w-0 px-0 text-[11px] font-semibold"
              onClick={() => setDurationDays(days)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ref-max" className="text-xs">
            Max. Einlösungen (leer = unbegrenzt)
          </Label>
          <Input
            id="ref-max"
            type="number"
            min={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="500"
            className="h-10"
          />
        </div>

        <Button type="submit" className="w-full h-10" disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Code anlegen
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : codes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Noch keine Codes</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {codes.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-mono font-bold tracking-wide">{row.code}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {row.influencer_name || "—"} · {formatDuration(row.duration_days)} · {row.redemption_count}
                  {row.max_redemptions != null ? `/${row.max_redemptions}` : ""} genutzt
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => void handleToggle(row.id, row.active)}
                aria-label={row.active ? "Deaktivieren" : "Aktivieren"}
              >
                {row.active ? (
                  <ToggleRight className="h-5 w-5 text-primary" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
