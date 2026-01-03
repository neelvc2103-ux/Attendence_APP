import { GoogleGenAI, Type } from "@google/genai";
import {
  AttendanceRecord,
  ScheduleUnit,
  CalendarEvent,
  UserPreferences,
  Insight
} from "./types";

/* ---------------------------------------------
   ENV (VITE SAFE)
--------------------------------------------- */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

/* ---------------------------------------------
   AI CLIENT (OPTIONAL)
--------------------------------------------- */
const ai = API_KEY
  ? new GoogleGenAI({ apiKey: API_KEY })
  : null;

/* ---------------------------------------------
   LOCAL RULE-BASED INSIGHTS (FALLBACK)
--------------------------------------------- */
const generateLocalInsights = (
  attendance: AttendanceRecord[],
  target: number,
  statuses: Record<string, { weight: number }>
): Insight[] => {
  if (attendance.length === 0) {
    return [{
      type: "HEALTH",
      title: "No Attendance Data",
      message: "Start marking attendance to get insights."
    }];
  }

  let total = 0;
  let earned = 0;

  attendance.forEach(r => {
    const def = statuses[r.status];
    if (def) {
      total += 1;
      earned += def.weight;
    }
  });

  if (total === 0) {
    return [{
      type: "HEALTH",
      title: "No Valid Records",
      message: "Attendance exists but no valid statuses were found."
    }];
  }

  const percentage = Math.round((earned / total) * 100);

  if (percentage < target) {
    return [{
      type: "WARNING",
      title: "Attendance Below Target",
      message: `Your attendance is ${percentage}%, below the target of ${target}%.`
    }];
  }

  return [{
    type: "HEALTH",
    title: "Attendance On Track",
    message: `Great job! Your attendance is ${percentage}%, which meets your target.`
  }];
};

/* ---------------------------------------------
   HYBRID AI INSIGHT GENERATOR
--------------------------------------------- */
export const generateHolisticInsights = async (
  units: ScheduleUnit[],
  attendance: AttendanceRecord[],
  events: CalendarEvent[],
  preferences: UserPreferences,
  target: number,
  statuses: Record<string, { weight: number }>
): Promise<Insight[]> => {

  // If AI key missing → fallback immediately
  if (!ai) {
    console.warn("Gemini API key missing. Using local insights.");
    return generateLocalInsights(attendance, target, statuses);
  }

  const prompt = `
Analyze the student's attendance and academic data and return insights.

DATA:
- Attendance Records: ${JSON.stringify(attendance)}
- Calendar Events: ${JSON.stringify(events)}
- Target Attendance: ${target}%
- Danger Threshold: ${preferences.dangerThreshold}%

RULES:
- CRITICAL: attendance below danger threshold
- WARNING: attendance below target
- HEALTH: attendance is safe

Return ONLY valid JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                enum: ["CRITICAL", "WARNING", "STRATEGY", "HEALTH"]
              },
              title: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ["type", "title", "message"]
          }
        }
      }
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.warn("Gemini unavailable, using local insights.", error);
    return generateLocalInsights(attendance, target, statuses);
  }
};

/* ---------------------------------------------
   OCR TIMETABLE PARSER
--------------------------------------------- */
export const parseTimetableFromOCR = async (ocrText: string) => {
  if (!ai) return null;

  const prompt = `
Extract weekly timetable data from OCR text and return JSON.

OCR TEXT:
${ocrText}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return null;
  }
};
