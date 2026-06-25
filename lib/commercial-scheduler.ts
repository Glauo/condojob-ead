import { processDueCampaigns } from "@/lib/commercial-campaigns";

declare global {
  // eslint-disable-next-line no-var
  var __condojobCommercialSchedulerStarted: boolean | undefined;
}

const INTERVAL_MS = 60_000;

export function startCommercialCampaignScheduler() {
  if (globalThis.__condojobCommercialSchedulerStarted) return;
  globalThis.__condojobCommercialSchedulerStarted = true;

  const run = async () => {
    try {
      await processDueCampaigns();
    } catch (error) {
      console.error("Erro no scheduler comercial:", error);
    }
  };

  setTimeout(run, 15_000);
  setInterval(run, INTERVAL_MS);
}
