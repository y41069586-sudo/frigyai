import { useCallback, useEffect, useState } from "react";
import { Euro, Loader2, Plus, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isReferralAdmin } from "@/lib/admin";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionError";
import { buildSignupDeepLink, buildSignupWebUrl } from "@/lib/chottuLinkConfig";
import { getPublicErrorMessage } from "@/lib/publicErrorMessage";

type ReferralCodeRow = {
  id: string;
  code: string;
  slug: string | null;
  influencer_name: string | null;
  commission_rate_percent: number;
  total_revenue_cents: number;
  total_commission_cents: number;
  total_payments: number;
  duration_days: number;
  max_redemptions: number | null;
  redemption_count: number;
  active: boolean;
};

function formatEur(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function ReferralCodesAdmin() {
  const { user, session } = useAuth();
  const [codes, setCodes] = useState<ReferralCodeRow[]>([]);
  const [totals, setTotals] = useState({ revenue_cents: 0, commission_cents: 0, payments: 0 });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [commissionRate, setCommissionRate] = useState("20");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const invoke = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("manage-referral-codes", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body,
      });
      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, data));
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    [session?.access_token],
  );

  const loadAffiliateStats = useCallback(async () => {
    if (!session?.access_token) return;
    const { data, error } = await supabase.functions.invoke("affiliate-admin", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: "revenue_report" },
    });
    if (error) {
      throw new Error(await getEdgeFunctionErrorMessage(error, data));
    }
    if (data?.error) throw new Error(data.error);
    setCodes((data?.partners as ReferralCodeRow[]) ?? []);
    setTotals(data?.totals ?? { revenue_cents: 0, commission_cents: 0, payments: 0 });
  }, [session?.access_token]);

  const loadCodesFallback = useCallback(async () => {
    const data = await invoke({ action: "list" });
    setCodes((data?.codes as ReferralCodeRow[]) ?? []);
    setTotals({ revenue_cents: 0, commission_cents: 0, payments: 0 });
  }, [invoke]);

  const loadCodes = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      await loadAffiliateStats();
    } catch (e: unknown) {
      try {
        await loadCodesFallback();
        const message = e instanceof Error ? e.message : "Laden fehlgeschlagen";
        toast({
          title: "Umsatzdaten nicht verfügbar",
          description: getPublicErrorMessage(message, "Die Umsatzzahlen konnten gerade nicht geladen werden. Die Partnerliste ist aber verfügbar."),
          variant: "destructive",
        });
      } catch (fallbackErr: unknown) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : e instanceof Error ? e.message : "Laden fehlgeschlagen";
        toast({
          title: "Fehler",
          description: getPublicErrorMessage(message, "Die Partnerdaten konnten gerade nicht geladen werden. Bitte versuche es erneut."),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loadAffiliateStats, loadCodesFallback, session?.access_token]);

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
        slug: newSlug.trim() || null,
        influencer_name: influencerName.trim() || null,
        commission_rate_percent: Number(commissionRate) || 20,
        duration_days: 0,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
      });
      toast({ title: "Partner erstellt", description: normalized });
      setNewCode("");
      setNewSlug("");
      setInfluencerName("");
      setMaxRedemptions("");
      await loadCodes();
    } catch (e: unknown) {
      toast({
        title: "Fehler",
        description: getPublicErrorMessage(e, "Der Partner konnte gerade nicht erstellt werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await invoke({ action: "toggle", id, active: !active });
      await loadCodes();
    } catch (e: unknown) {
      toast({
        title: "Fehler",
        description: getPublicErrorMessage(e, "Die Änderung konnte gerade nicht gespeichert werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        <h4 className="text-sm font-semibold">Affiliate & Empfehlungscodes</h4>
      </div>

      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs space-y-1">
        <p className="flex items-center gap-1 font-medium">
          <Euro className="h-3.5 w-3.5" />
          Umsatz gesamt: {formatEur(totals.revenue_cents)} · Provision: {formatEur(totals.commission_cents)}
        </p>
        <p className="text-muted-foreground">{totals.payments} Store-Zahlungen zugeordnet</p>
        <p className="text-muted-foreground">
          Codes dienen nur der Partner-Zuordnung — Premium läuft über App Store / Google Play.
        </p>
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
              placeholder="PROMO1"
              className="h-10 font-mono uppercase tracking-widest"
              maxLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref-slug" className="text-xs">
              ChottuLink ?ref=
            </Label>
            <Input
              id="ref-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20))}
              placeholder="proml"
              className="h-10 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
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
          <div className="space-y-1.5">
            <Label htmlFor="ref-commission" className="text-xs">
              Provision %
            </Label>
            <Input
              id="ref-commission"
              type="number"
              min={0}
              max={100}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="h-10"
            />
          </div>
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
          Partner anlegen
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : codes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Noch keine Partner</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {codes.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono font-bold tracking-wide">
                  {row.code}
                  {row.slug ? (
                    <span className="ml-2 text-xs font-normal text-primary">?ref={row.slug}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {row.influencer_name || "—"} · {row.commission_rate_percent}% · {row.redemption_count} Einlösungen
                </p>
                <p className="text-xs text-muted-foreground">
                  Umsatz {formatEur(Number(row.total_revenue_cents ?? 0))} · Provision{" "}
                  {formatEur(Number(row.total_commission_cents ?? 0))} · {row.total_payments ?? 0} Zahlungen
                </p>
                {row.slug ? (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5" title={buildSignupWebUrl(row.slug)}>
                    {buildSignupDeepLink(row.slug)}
                  </p>
                ) : null}
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
