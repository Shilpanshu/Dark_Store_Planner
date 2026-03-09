import { GoogleGenerativeAI } from "@google/generative-ai";
import type { POIData } from "./mockPOI";

export interface GeminiResult {
    allocation: Record<string, string>;
    justification: string;
}

const SYSTEM_PROMPT = `You are a Category Planner for a 60-minute Quick Commerce Apparel and Fashion brand called KNOT. You operate dark stores that deliver clothing and fashion items within 60 minutes.

Given the Point-of-Interest (POI) profile of the area surrounding a proposed dark store and the delivery radius in kilometres, you must allocate 100% of the dark store's inventory across APPAREL AND FASHION categories ONLY.

CRITICAL RULES:
1. You must ONLY use apparel and fashion categories. You are NOT a grocery service. You do NOT sell food, beverages, dairy, baby care, or any FMCG products.
2. Valid category examples: High-Velocity Basics (T-shirts, Innerwear), Premium Office Wear (Polos, Trousers, Formal Shirts), Casual & Streetwear (Jeans, Hoodies, Joggers), Heavy Winter Wear (Jackets, Sweaters), Ethnic & Festive Wear (Kurtas, Sarees), Athleisure & Sportswear, Women's Western Wear, Kids' Clothing, Accessories (Belts, Wallets, Caps, Sunglasses), Footwear (Sneakers, Sandals, Formal Shoes), and Safety Stock.
3. Tailor the mix to the demographics: students need basics & streetwear, tech professionals need office wear, affluent areas need premium/branded items, family zones need kids' clothing.
4. All category percentages MUST sum to exactly 100%.
5. Always include a "Safety Stock" category of 5-15%.
6. Output ONLY valid JSON in this exact shape – no markdown, no code fences:
{
  "allocation": { "<Apparel Category>": "<X%>", ... },
  "justification": "<Exactly 2 sentences explaining the strategic rationale for this apparel mix.>"
}`;

/* ── Retry helper ──────────────────────────────────────── */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    baseDelayMs = 2500
): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: unknown) {
            const isRateLimit =
                err instanceof Error && err.message.includes("429");
            if (!isRateLimit || attempt === maxRetries) throw err;
            const delay = baseDelayMs * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw new Error("Retry exhausted");
}

/* ── POI-aware APPAREL fallback ────────────────────────── */
function generateMockAllocation(poi: POIData): GeminiResult {
    const hasColleges = poi.colleges >= 5;
    const hasTechParks = poi.techParks >= 3;
    const isFamilyZone = poi.demographics.toLowerCase().includes("famil");
    const isAffluent = poi.demographics.toLowerCase().includes("affluent");
    const isYoung = poi.demographics.toLowerCase().includes("student") ||
        poi.demographics.toLowerCase().includes("young") ||
        poi.demographics.toLowerCase().includes("24-");

    if (hasColleges && isYoung) {
        // Student / young professional zone
        return {
            allocation: {
                "High-Velocity Basics (T-shirts, Innerwear)": "30%",
                "Casual & Streetwear (Jeans, Hoodies)": "20%",
                "Athleisure & Sportswear": "12%",
                "Footwear (Sneakers, Sandals)": "12%",
                "Accessories (Caps, Sunglasses, Wallets)": "8%",
                "Premium Office Wear (Polos, Trousers)": "8%",
                "Safety Stock": "10%",
            },
            justification: `With ${poi.colleges} colleges and a ${poi.density} density of ${poi.demographics.toLowerCase()}, this ${poi.zone} dark store should prioritize high-turnover basics and streetwear that drive impulse purchases. The student demographic demands affordable, trend-driven inventory with strong athleisure and sneaker presence.`,
        };
    }

    if (hasTechParks) {
        // IT professional zone
        return {
            allocation: {
                "Premium Office Wear (Polos, Formal Shirts, Trousers)": "25%",
                "High-Velocity Basics (T-shirts, Innerwear)": "20%",
                "Casual & Streetwear (Jeans, Chinos)": "15%",
                "Footwear (Formal Shoes, Sneakers)": "10%",
                "Athleisure & Sportswear": "10%",
                "Accessories (Belts, Wallets, Laptop Bags)": "10%",
                "Safety Stock": "10%",
            },
            justification: `${poi.techParks} tech parks with ${poi.density} density of ${poi.demographics.toLowerCase()} create strong demand for smart-casual office wear and quick wardrobe refreshes during work hours. A 25% allocation to premium office wear captures the high-frequency weekday demand from IT professionals.`,
        };
    }

    if (isAffluent) {
        // Affluent / premium zone
        return {
            allocation: {
                "Premium Office Wear (Polos, Trousers, Blazers)": "22%",
                "Women's Western Wear (Dresses, Tops)": "15%",
                "Casual & Streetwear (Branded Jeans, Hoodies)": "13%",
                "High-Velocity Basics (Premium T-shirts, Innerwear)": "12%",
                "Footwear (Sneakers, Formal Shoes, Heels)": "10%",
                "Accessories (Sunglasses, Watches, Belts)": "10%",
                "Ethnic & Festive Wear (Kurtas, Sarees)": "8%",
                "Safety Stock": "10%",
            },
            justification: `${poi.zone}'s affluent demographic (${poi.demographics.toLowerCase()}) with ${poi.shoppingMalls} nearby malls indicates high willingness-to-pay for premium branded apparel and fashion-forward categories. A premium-heavy mix with 22% office wear and 15% women's western wear captures the aspirational spending patterns.`,
        };
    }

    if (isFamilyZone) {
        // Family-centric zone
        return {
            allocation: {
                "High-Velocity Basics (T-shirts, Innerwear)": "22%",
                "Kids' Clothing (Boys & Girls)": "15%",
                "Women's Western & Ethnic Wear": "13%",
                "Premium Office Wear (Formal Shirts, Trousers)": "12%",
                "Casual & Streetwear (Jeans, Joggers)": "10%",
                "Footwear (Family Range)": "10%",
                "Accessories (Belts, Wallets)": "8%",
                "Safety Stock": "10%",
            },
            justification: `The family-centric ${poi.zone} zone with ${poi.residentialComplexes} residential complexes and ${poi.hospitals} hospitals demands a balanced apparel mix spanning all age groups and genders. A 15% kids' clothing and 13% women's wear allocation captures the multi-member household purchasing pattern.`,
        };
    }

    // Generic balanced apparel fallback
    return {
        allocation: {
            "High-Velocity Basics (T-shirts, Innerwear)": "25%",
            "Casual & Streetwear (Jeans, Hoodies, Joggers)": "18%",
            "Premium Office Wear (Polos, Trousers)": "15%",
            "Footwear (Sneakers, Sandals, Formal)": "10%",
            "Accessories (Belts, Wallets, Caps)": "8%",
            "Women's Western Wear": "7%",
            "Ethnic & Festive Wear": "7%",
            "Safety Stock": "10%",
        },
        justification: `The ${poi.zone} node with ${poi.density} density and ${poi.residentialComplexes} residential complexes requires a balanced general-purpose apparel inventory anchored by high-turnover basics. This mix ensures coverage across casual, office, and occasion wear for the ${poi.demographics.toLowerCase()} catchment.`,
    };
}

/* ── Main export ───────────────────────────────────────── */
export async function analyzeWithGemini(
    poiData: POIData,
    radiusKm: number,
    apiKey: string
): Promise<GeminiResult> {
    try {
        const result = await withRetry(async () => {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const userPrompt = `
Dark Store Location: ${poiData.zone}
Delivery Radius: ${radiusKm.toFixed(1)} km
POI Profile: ${poiData.summary}

You are planning inventory for a Quick Commerce APPAREL brand (NOT grocery). Allocate fashion/clothing inventory categories for this dark store.`;

            return model.generateContent({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512,
                },
            });
        });

        const text = result.response.text().trim();
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        try {
            const parsed: GeminiResult = JSON.parse(cleaned);
            return parsed;
        } catch {
            return {
                allocation: { "Parse Error": "100%" },
                justification: `Could not parse Gemini response. Raw: ${cleaned.slice(0, 200)}`,
            };
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isQuotaError = msg.includes("429") || msg.includes("quota");
        const label = isQuotaError
            ? "⚡ AI Fallback (quota exceeded)"
            : "⚡ AI Fallback (API error)";

        console.warn(`Gemini error for ${poiData.zone} — using intelligent mock allocation:`, msg);
        const mock = generateMockAllocation(poiData);
        mock.justification = `${label}: ${mock.justification}`;
        return mock;
    }
}
