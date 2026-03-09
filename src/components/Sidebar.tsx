import { useState } from "react";
import type { Pin, RadiusCircle } from "./MapView";
import type { POIData } from "../utils/mockPOI";
import type { GeminiResult } from "../utils/gemini";

/* ── City coords ──────────────────────────────────────── */
const CITIES: Record<string, [number, number]> = {
    Bengaluru: [12.9716, 77.5946],
    Mumbai: [19.076, 72.8777],
    Delhi: [28.6139, 77.209],
};

interface PinAnalysis {
    pinId: string;
    zone: string;
    poi: POIData;
    radiusKm: number;
    gemini: GeminiResult | null;
    loading: boolean;
    error: string | null;
}

interface SidebarProps {
    selectedCity: string;
    onCityChange: (city: string) => void;
    deliveryTime: number;
    onDeliveryTimeChange: (t: number) => void;
    pins: Pin[];
    circles: RadiusCircle[];
    onCalculate: () => void;
    analyses: PinAnalysis[];
    apiKey: string;
    onApiKeyChange: (k: string) => void;
}

export type { PinAnalysis };
export { CITIES };

export default function Sidebar({
    selectedCity,
    onCityChange,
    deliveryTime,
    onDeliveryTimeChange,
    pins,
    onCalculate,
    analyses,
    apiKey,
    onApiKeyChange,
}: SidebarProps) {
    const [showKey, setShowKey] = useState(false);

    return (
        <aside
            style={{
                width: "30%",
                minWidth: 340,
                height: "100%",
                background: "var(--bg-sidebar)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* ── Header ──────────────────────────────────────── */}
            <div
                style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid var(--border)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #6c63ff, #4f46e5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 16px rgba(108,99,255,0.35)",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                            Dark Store Planner
                        </h1>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                            Quick Commerce Placement & Assortment
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Scrollable body ─────────────────────────────── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {/* API Key */}
                <label style={labelStyle}>
                    Gemini API Key
                </label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                    <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        placeholder="Paste your API key…"
                        style={{ ...inputStyle, paddingRight: 40 }}
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        {showKey ? "Hide" : "Show"}
                    </button>
                </div>

                {/* City */}
                <label style={labelStyle}>City</label>
                <select
                    value={selectedCity}
                    onChange={(e) => onCityChange(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 16, cursor: "pointer" }}
                >
                    {Object.keys(CITIES).map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                {/* Delivery Time */}
                <label style={labelStyle}>Delivery Time (minutes)</label>
                <input
                    type="number"
                    min={1}
                    max={120}
                    value={deliveryTime}
                    onChange={(e) => onDeliveryTimeChange(Number(e.target.value))}
                    style={{ ...inputStyle, marginBottom: 16 }}
                />

                {/* Stats bar */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 16,
                    }}
                >
                    <StatChip label="Pins" value={pins.length} color="var(--accent)" />
                    <StatChip
                        label="Radius"
                        value={`${((deliveryTime / 60) * 15).toFixed(1)} km`}
                        color="var(--success)"
                    />
                </div>

                {/* Calculate Button */}
                <button
                    onClick={onCalculate}
                    disabled={pins.length === 0}
                    style={{
                        width: "100%",
                        padding: "12px 0",
                        border: "none",
                        borderRadius: 10,
                        background:
                            pins.length === 0
                                ? "var(--bg-input)"
                                : "linear-gradient(135deg, #6c63ff, #4f46e5)",
                        color: pins.length === 0 ? "var(--text-secondary)" : "#fff",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: pins.length === 0 ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: pins.length > 0 ? "0 4px 20px rgba(108,99,255,0.35)" : "none",
                        marginBottom: 24,
                        letterSpacing: "0.02em",
                    }}
                >
                    {pins.length === 0 ? "Drop a pin on the map first" : "⚡ Calculate Delivery Radius"}
                </button>

                {/* Instruction */}
                {pins.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            fontSize: 13,
                            padding: "20px 0",
                            lineHeight: 1.6,
                        }}
                    >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
                        Click anywhere on the map to place a Dark Store pin
                    </div>
                )}

                {/* ── Analyses ─────────────────────────────────── */}
                {analyses.map((a) => (
                    <div
                        key={a.pinId}
                        style={{
                            background: "var(--bg-card)",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 14,
                            border: "1px solid var(--border)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: a.loading
                                        ? "var(--warning)"
                                        : a.error
                                            ? "#ef4444"
                                            : "var(--success)",
                                    boxShadow: `0 0 6px ${a.loading
                                            ? "rgba(251,191,36,0.5)"
                                            : a.error
                                                ? "rgba(239,68,68,0.5)"
                                                : "rgba(52,211,153,0.5)"
                                        }`,
                                }}
                            />
                            <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                                {a.zone} Zone
                            </h3>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: "var(--text-secondary)",
                                    marginLeft: "auto",
                                }}
                            >
                                {a.radiusKm.toFixed(1)} km radius
                            </span>
                        </div>

                        {/* POI Summary */}
                        <p
                            style={{
                                fontSize: 12,
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                                marginBottom: 12,
                                background: "var(--bg-input)",
                                padding: "8px 10px",
                                borderRadius: 8,
                            }}
                        >
                            {a.poi.summary}
                        </p>

                        {/* Loading */}
                        {a.loading && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    color: "var(--warning)",
                                    fontSize: 12,
                                }}
                            >
                                <span className="animate-pulse">●</span> Analyzing with Gemini…
                            </div>
                        )}

                        {/* Error */}
                        {a.error && (
                            <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>
                                ⚠ {a.error}
                            </p>
                        )}

                        {/* Gemini Result */}
                        {a.gemini && (
                            <>
                                <h4
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        marginBottom: 8,
                                        color: "var(--accent)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    Inventory Allocation
                                </h4>
                                <div style={{ marginBottom: 12 }}>
                                    {Object.entries(a.gemini.allocation).map(([cat, pct]) => (
                                        <div
                                            key={cat}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "6px 0",
                                                borderBottom: "1px solid var(--border)",
                                                fontSize: 13,
                                            }}
                                        >
                                            <span>{cat}</span>
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: "var(--accent)",
                                                    background: "var(--accent-glow)",
                                                    padding: "2px 8px",
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                }}
                                            >
                                                {pct}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text-secondary)",
                                        lineHeight: 1.6,
                                        fontStyle: "italic",
                                        background: "var(--bg-input)",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                    }}
                                >
                                    {a.gemini.justification}
                                </p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Footer ──────────────────────────────────────── */}
            <div
                style={{
                    padding: "12px 24px",
                    borderTop: "1px solid var(--border)",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                }}
            >
                Powered by Gemini AI · © 2026 Dark Store Planner
            </div>
        </aside>
    );
}

/* ── Helpers ────────────────────────────────────────────── */
function StatChip({
    label,
    value,
    color,
}: {
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div
            style={{
                flex: 1,
                background: "var(--bg-card)",
                borderRadius: 10,
                padding: "10px 12px",
                border: "1px solid var(--border)",
            }}
        >
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
};
