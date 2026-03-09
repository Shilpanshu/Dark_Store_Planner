export interface POIData {
    zone: string;
    colleges: number;
    techParks: number;
    hospitals: number;
    shoppingMalls: number;
    residentialComplexes: number;
    density: "Low" | "Medium" | "High" | "Very High";
    demographics: string;
    summary: string;
}

interface Zone {
    name: string;
    lat: [number, number];
    lng: [number, number];
    data: Omit<POIData, "zone" | "summary">;
}

const BENGALURU_ZONES: Zone[] = [
    {
        name: "Koramangala",
        lat: [12.925, 12.945],
        lng: [77.615, 77.635],
        data: {
            colleges: 14,
            techParks: 3,
            hospitals: 5,
            shoppingMalls: 4,
            residentialComplexes: 22,
            density: "Very High",
            demographics: "Young professionals & students (avg age 24-32)",
        },
    },
    {
        name: "Whitefield",
        lat: [12.955, 12.985],
        lng: [77.735, 77.765],
        data: {
            colleges: 4,
            techParks: 12,
            hospitals: 6,
            shoppingMalls: 5,
            residentialComplexes: 35,
            density: "High",
            demographics: "IT professionals & families (avg age 28-40)",
        },
    },
    {
        name: "Indiranagar",
        lat: [12.97, 12.985],
        lng: [77.635, 77.655],
        data: {
            colleges: 3,
            techParks: 2,
            hospitals: 4,
            shoppingMalls: 6,
            residentialComplexes: 18,
            density: "Very High",
            demographics: "Affluent young professionals (avg age 26-38)",
        },
    },
    {
        name: "Electronic City",
        lat: [12.835, 12.86],
        lng: [77.66, 77.685],
        data: {
            colleges: 6,
            techParks: 15,
            hospitals: 3,
            shoppingMalls: 2,
            residentialComplexes: 28,
            density: "High",
            demographics: "IT workforce & families (avg age 25-35)",
        },
    },
    {
        name: "HSR Layout",
        lat: [12.905, 12.925],
        lng: [77.635, 77.655],
        data: {
            colleges: 5,
            techParks: 4,
            hospitals: 3,
            shoppingMalls: 3,
            residentialComplexes: 30,
            density: "Very High",
            demographics: "Startup founders & tech workers (avg age 24-34)",
        },
    },
    {
        name: "Jayanagar",
        lat: [12.92, 12.94],
        lng: [77.575, 77.595],
        data: {
            colleges: 8,
            techParks: 1,
            hospitals: 7,
            shoppingMalls: 5,
            residentialComplexes: 25,
            density: "High",
            demographics: "Mixed residential, families (avg age 30-50)",
        },
    },
    {
        name: "Marathahalli",
        lat: [12.95, 12.965],
        lng: [77.695, 77.715],
        data: {
            colleges: 3,
            techParks: 6,
            hospitals: 4,
            shoppingMalls: 4,
            residentialComplexes: 32,
            density: "High",
            demographics: "Working professionals & migrants (avg age 24-35)",
        },
    },
    {
        name: "Rajajinagar",
        lat: [12.99, 13.01],
        lng: [77.545, 77.57],
        data: {
            colleges: 6,
            techParks: 1,
            hospitals: 5,
            shoppingMalls: 3,
            residentialComplexes: 20,
            density: "Medium",
            demographics: "Traditional residential, older demographics (avg age 35-55)",
        },
    },
];

function findClosestZone(lat: number, lng: number): Zone {
    let closest = BENGALURU_ZONES[0];
    let minDist = Infinity;

    for (const zone of BENGALURU_ZONES) {
        const midLat = (zone.lat[0] + zone.lat[1]) / 2;
        const midLng = (zone.lng[0] + zone.lng[1]) / 2;
        const dist = Math.sqrt((lat - midLat) ** 2 + (lng - midLng) ** 2);
        if (dist < minDist) {
            minDist = dist;
            closest = zone;
        }
    }
    return closest;
}

export function getMockPOIData(lat: number, lng: number): POIData {
    const zone = findClosestZone(lat, lng);

    // Add slight randomisation so repeated clicks feel different
    const jitter = () => Math.floor(Math.random() * 3) - 1;
    const data = { ...zone.data };
    data.colleges = Math.max(0, data.colleges + jitter());
    data.techParks = Math.max(0, data.techParks + jitter());
    data.hospitals = Math.max(0, data.hospitals + jitter());

    const summary =
        `${zone.name} node: ${data.colleges} Colleges, ${data.techParks} Tech Parks, ` +
        `${data.hospitals} Hospitals, ${data.shoppingMalls} Shopping Malls, ` +
        `${data.residentialComplexes} Residential Complexes. ` +
        `${data.density} Density. ${data.demographics}.`;

    return { zone: zone.name, ...data, summary };
}
