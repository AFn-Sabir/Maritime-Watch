import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Disruption, GroundingSource } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

export const fetchDisruptions = async (): Promise<{ disruptions: Disruption[], sources: GroundingSource[] }> => {
  try {
    const currentYear = new Date().getFullYear(); // 2025
    const prompt = `
      Act as a maritime security analyst. Search for the latest, real-time ongoing maritime disruptions impacting ocean freight and global shipping lanes in ${currentYear}.
      
      CRITICAL: Only include events that are active or occurred in ${currentYear}. Do not include outdated events from previous years.

      Specifically prioritize searching for:
      1. Severe weather events globally (Typhoons, Hurricanes, Cyclones, Heavy Fog, or Ice) that are currently closing ports, delaying vessels, or forcing rerouting in ${currentYear}.
      2. Disruptions in the Benelux region (Rotterdam, Antwerp) such as congestion, strikes, or delays.
      3. Disruptions at major Chinese Ports (Shanghai, Ningbo, Shenzhen, etc.) due to weather, regulation, or congestion.
      4. Global hotspots: Red Sea/Suez Canal attacks, Panama Canal restrictions, major port strikes in US/Europe, piracy.

      Return the data strictly as a JSON array of objects.
      Each object must have:
      - id: string (unique)
      - title: string (short headline)
      - description: string (concise summary of impact)
      - severity: "High" | "Medium" | "Low"
      - type: "Conflict" | "Weather" | "Strike" | "Accident" | "Regulatory" | "Other"
      - locationName: string
      - latitude: number
      - longitude: number
      - date: string (YYYY-MM-DD)
      - sources: array of objects { "title": string, "url": string } containing 3-5 distinct, reputable news sources (e.g., Reuters, Bloomberg, Maritime Executive, Splash247, gCaptain) verifying this specific incident.

      Ensure coordinates are reasonably accurate for the location (e.g., specific port, canal, or strait).
      Prioritize the most recent and high-impact events.
      Do not include markdown code blocks in the output, just the raw JSON string if possible, or wrapped in json code block.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json", 
      },
    });

    const text = response.text || "[]";
    
    // Clean up potential markdown code blocks if the model adds them despite instructions
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let rawData: any[] = [];
    try {
      rawData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", text);
      throw new Error("Failed to parse data from AI model.");
    }

    const disruptions: Disruption[] = rawData.map((item: any, index: number) => ({
      id: item.id || `inc-${index}-${Date.now()}`,
      title: item.title || "Unknown Incident",
      description: item.description || "No details available.",
      severity: ["High", "Medium", "Low"].includes(item.severity) ? item.severity : "Medium",
      type: item.type || "Other",
      locationName: item.locationName || "Unknown Location",
      coordinates: [item.longitude || 0, item.latitude || 0], // D3 uses [lng, lat]
      date: item.date || new Date().toISOString().split('T')[0],
      sources: Array.isArray(item.sources) ? item.sources : []
    }));

    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    // Remove duplicates from sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { disruptions, sources: uniqueSources };

  } catch (error) {
    console.error("Error fetching disruptions:", error);
    throw error;
  }
};