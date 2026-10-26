"use client";

import * as React from "react";

import { Clock, ExternalLink, Loader2, MapPin, Navigation, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MapPoint = {
  lat: number;
  lng: number;
};

type RouteResult = {
  /** Distância em metros. */
  distance: number;
  /** Duração em segundos. */
  duration: number;
  /** false quando calculada em linha reta (fallback do OSRM). */
  exact: boolean;
};

type MatchFieldMapProps = {
  fieldName?: string | null;
  address?: string | null;
  cityName?: string | null;
};

type OriginState = "locating" | "ready" | "denied" | "unsupported";
type RouteState = "idle" | "loading" | "ready" | "failed";

/** Cache de geocodificação (Nominatim) para não repetir pedidos entre partidas. */
const geocodeCache = new Map<string, MapPoint | null>();

async function geocode(query: string): Promise<MapPoint | null> {
  const cached = geocodeCache.get(query);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error(String(response.status));

    const rows = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = rows[0];
    const point =
      hit?.lat != null && hit?.lon != null ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
    const result = point && Number.isFinite(point.lat) && Number.isFinite(point.lng) ? point : null;
    geocodeCache.set(query, result);
    return result;
  } catch {
    geocodeCache.set(query, null);
    return null;
  }
}

function haversineMeters(from: MapPoint, to: MapPoint): number {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export function MatchFieldMap({ fieldName, address, cityName }: MatchFieldMapProps) {
  const [fieldCoords, setFieldCoords] = React.useState<MapPoint | null>(null);
  const [geocodeFailed, setGeocodeFailed] = React.useState(false);
  const [origin, setOrigin] = React.useState<MapPoint | null>(null);
  const [originState, setOriginState] = React.useState<OriginState>("locating");
  const [route, setRoute] = React.useState<RouteResult | null>(null);
  const [routeState, setRouteState] = React.useState<RouteState>("idle");
  const [originAttempt, setOriginAttempt] = React.useState(0);

  const addressLine = [address, cityName].filter(Boolean).join(", ");
  const mapQuery = addressLine || [fieldName, cityName].filter(Boolean).join(", ") || "Angola";

  // Geocodifica o endereço do campo (com fallback para a cidade).
  React.useEffect(() => {
    let cancelled = false;
    setGeocodeFailed(false);
    setFieldCoords(null);

    const candidates = [addressLine, [cityName, "Angola"].filter(Boolean).join(", ")].filter(
      (value, index, list) => value && list.indexOf(value) === index,
    ) as string[];

    if (candidates.length === 0) {
      setGeocodeFailed(true);
      return;
    }

    void (async () => {
      for (const candidate of candidates) {
        const point = await geocode(candidate);
        if (cancelled) return;
        if (point) {
          setFieldCoords(point);
          return;
        }
      }
      if (!cancelled) setGeocodeFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [addressLine, cityName]);

  // Obtém a localização do utilizador (com retry manual).
  React.useEffect(() => {
    if (!("geolocation" in navigator)) {
      setOriginState("unsupported");
      return;
    }

    setOriginState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setOriginState("ready");
      },
      (error) => {
        setOriginState(error.code === error.PERMISSION_DENIED ? "denied" : "unsupported");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [originAttempt]);

  // Calcula a rota (OSRM) entre a localização do utilizador e o campo.
  React.useEffect(() => {
    if (!origin || !fieldCoords) {
      setRoute(null);
      setRouteState("idle");
      return;
    }

    let cancelled = false;
    setRouteState("loading");

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${fieldCoords.lng},${fieldCoords.lat}?overview=false`;

    void fetch(url)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: unknown) => {
        const routes = (payload as { routes?: Array<{ distance?: number; duration?: number }> }).routes;
        const best = routes?.[0];
        if (!best || typeof best.distance !== "number" || typeof best.duration !== "number") {
          throw new Error("route not found");
        }
        if (!cancelled) {
          setRoute({ distance: best.distance, duration: best.duration, exact: true });
          setRouteState("ready");
        }
      })
      .catch(() => {
        if (cancelled) return;
        const straight = haversineMeters(origin, fieldCoords);
        if (straight > 0 && Number.isFinite(straight)) {
          // Fallback: linha reta com velocidade média urbana (~40 km/h).
          setRoute({ distance: straight, duration: straight / 11.1, exact: false });
          setRouteState("ready");
        } else {
          setRouteState("failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [origin, fieldCoords]);

  const directionsUrl =
    origin && fieldCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${fieldCoords.lat},${fieldCoords.lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const showRouteStats = originState === "ready" && routeState === "ready" && route !== null;
  const waitingOrigin = originState === "locating";
  const originUnavailable = originState === "denied" || originState === "unsupported";

  return (
    <div className="relative size-full min-h-0 overflow-hidden bg-muted">
      <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
      <iframe
        title={`Google Maps — ${fieldName ?? mapQuery}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&hl=pt&output=embed`}
        className="absolute inset-0 size-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center sm:inset-x-3 sm:bottom-3 sm:justify-start">
        <div className="pointer-events-auto w-full max-w-sm rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="truncate font-medium text-sm leading-tight">{fieldName ?? "Campo"}</div>
              {addressLine && <div className="truncate text-muted-foreground text-xs">{addressLine}</div>}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2 text-xs">
            {showRouteStats && route && (
              <>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Navigation className="size-3.5 text-primary" />
                  {route.exact ? "" : "≈ "}
                  {formatDistance(route.distance)}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Clock className="size-3.5 text-primary" />
                  {route.exact ? "" : "≈ "}
                  {formatDuration(route.duration)}
                </span>
              </>
            )}

            {waitingOrigin && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                A obter a sua localização…
              </span>
            )}

            {!waitingOrigin && originUnavailable && (
              <span className="text-muted-foreground">
                {geocodeFailed
                  ? "Endereço do campo indisponível."
                  : "Ative a localização para ver distância e tempo."}
              </span>
            )}

            {!waitingOrigin && originState === "ready" && routeState === "loading" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                A calcular a rota…
              </span>
            )}

            {!waitingOrigin && originState === "ready" && routeState === "failed" && (
              <span className="text-muted-foreground">Rota indisponível.</span>
            )}

            {originUnavailable && !geocodeFailed && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setOriginAttempt((value) => value + 1)}
              >
                <RotateCcw className="size-3" />
                Tentar novamente
              </Button>
            )}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "ml-auto flex items-center gap-1 font-medium text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
                (waitingOrigin || showRouteStats) && "hidden sm:flex",
              )}
            >
              <ExternalLink className="size-3.5" />
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
