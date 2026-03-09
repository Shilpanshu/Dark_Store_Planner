import { useState, useCallback } from "react";
import MapView from "./components/MapView";
import Sidebar, { CITIES } from "./components/Sidebar";
import type { Pin, RadiusCircle } from "./components/MapView";
import type { PinAnalysis } from "./components/Sidebar";
import { getMockPOIData } from "./utils/mockPOI";
import { analyzeWithGemini } from "./utils/gemini";
import "./index.css";

const AVERAGE_SPEED_KMH = 15; // Bangalore traffic avg

export default function App() {
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const [deliveryTime, setDeliveryTime] = useState(60);
  const [pins, setPins] = useState<Pin[]>([]);
  const [circles, setCircles] = useState<RadiusCircle[]>([]);
  const [analyses, setAnalyses] = useState<PinAnalysis[]>([]);
  const [apiKey, setApiKey] = useState(
    () => import.meta.env.VITE_GEMINI_API_KEY ?? ""
  );

  const center = CITIES[selectedCity] as [number, number];

  /* ── Drop a pin ─────────────────────────────────────── */
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const id = crypto.randomUUID();
    setPins((prev) => [...prev, { id, lat, lng }]);
  }, []);

  /* ── Calculate radius + trigger analysis ────────────── */
  const handleCalculate = useCallback(async () => {
    const radiusKm = (deliveryTime / 60) * AVERAGE_SPEED_KMH;
    const radiusMeters = radiusKm * 1000;

    // Build circles for ALL pins
    const newCircles: RadiusCircle[] = pins.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      radiusMeters,
    }));
    setCircles(newCircles);

    // Create analysis entries (loading state)
    const newAnalyses: PinAnalysis[] = pins.map((p) => {
      const poi = getMockPOIData(p.lat, p.lng);
      return {
        pinId: p.id,
        zone: poi.zone,
        poi,
        radiusKm,
        gemini: null,
        loading: true,
        error: null,
      };
    });
    setAnalyses(newAnalyses);

    // Fire Gemini calls for each pin
    for (let i = 0; i < newAnalyses.length; i++) {
      const a = newAnalyses[i];
      if (!apiKey) {
        setAnalyses((prev) =>
          prev.map((x) =>
            x.pinId === a.pinId
              ? { ...x, loading: false, error: "No API key provided" }
              : x
          )
        );
        continue;
      }

      try {
        const result = await analyzeWithGemini(a.poi, radiusKm, apiKey);
        setAnalyses((prev) =>
          prev.map((x) =>
            x.pinId === a.pinId
              ? { ...x, loading: false, gemini: result }
              : x
          )
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setAnalyses((prev) =>
          prev.map((x) =>
            x.pinId === a.pinId
              ? { ...x, loading: false, error: message }
              : x
          )
        );
      }
    }
  }, [pins, deliveryTime, apiKey]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        deliveryTime={deliveryTime}
        onDeliveryTimeChange={setDeliveryTime}
        pins={pins}
        circles={circles}
        onCalculate={handleCalculate}
        analyses={analyses}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
      <div style={{ flex: 1, height: "100%" }}>
        <MapView
          center={center}
          pins={pins}
          circles={circles}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}
