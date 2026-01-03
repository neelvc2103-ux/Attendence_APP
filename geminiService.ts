import { GoogleGenAI, Type } from "@google/genai";
import {
  AttendanceRecord,
  ScheduleUnit,
  CalendarEvent,
  UserPreferences,
  Insight
} from "./types";

/* ---------------------------------------------
   AI CLIENT (OPTIONAL)
--------------------------------------------- */
const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY
});

/* ---------------------------------------------
   LOCAL RULE-BASED INSIGHTS (SOURCE OF TRUTH)
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
      message: "Attendance records exist but no valid statuses were found."
    }];
  }

  const percentage = Math.round((earned / total) * 100);

  if (percentage < target) {
    return [{
      type: "WARNING",
      title: "Attendance Below Target",
      message: `Your attendance is ${percentage}%, below the target of ${target}%. Attend upcoming classes to stay safe.`
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
    console.warn("AI unavailable, using local insights.", error);

    // ✅ SINGLE SOURCE OF TRUTH FALLBACK
    return generateLocalInsights(
      attendance,
      target,
      statuses
    );
  }
};

/* ---------------------------------------------
   OCR TIMETABLE PARSER
--------------------------------------------- */
export const parseTimetableFromOCR = async (ocrText: string) => {
  const prompt = `
Extract weekly timetable data from OCR text and return JSON.

OCR TEXT:
${ocrText}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return null;
  }
};
