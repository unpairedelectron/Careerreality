export type AlertSubscriberPreferences = {
  companySlugs: string[];
  city?: string | null;
  sector?: string | null;
};

export type AlertEventMatch = {
  slug: string;
  status: "Confirmed" | "Reported" | "Rumour";
  geography: string;
  sector?: string;
};

export function matchesLayoffAlert(
  subscriber: AlertSubscriberPreferences,
  event: AlertEventMatch,
): boolean {
  if (event.status === "Rumour") return false;
  if (subscriber.companySlugs.includes(event.slug)) return true;

  const city = subscriber.city?.trim().toLocaleLowerCase();
  const matchesCity = !city || event.geography.toLocaleLowerCase().includes(city);
  const matchesSector = !subscriber.sector || subscriber.sector === event.sector;
  return matchesCity && matchesSector;
}
