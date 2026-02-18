import { GoogleGenAI } from "@google/genai";
import { PlayerStats, SeasonHistoryEntry } from "../types";

export const generateLeagueCommentary = async (
  leagueName: string,
  stats: PlayerStats[],
  history: SeasonHistoryEntry[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const statsSummary = stats
    .map(p => `${p.name}: ${p.pts} נק', הפרש ${p.gd}`)
    .join(", ");

  const historySummary = history.length > 0 
    ? history.slice(-3).map(h => `עונת ${h.seasonName}: אלוף ליגת העל - ${h.premierWinner || 'לא ידוע'}`).join("\n")
    : "אין היסטוריה קודמת מתועדת.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ניתוח טבלה עבור: ${leagueName}\n\nנתונים נוכחיים:\n${statsSummary}\n\nהיסטוריה מהעבר:\n${historySummary}`,
      config: {
        systemInstruction: `אתה כתב ספורט בכיר המתמחה בליגת FIFA. 
נתח את מצב הטבלה הנוכחי תוך התייחסות להיסטוריה אם קיימת (למשל: "האלוף המכהן מתקשה" או "שחקן X מחפש דאבל").
כתוב כותרת דרמטית ופסקה קצרה (עד 3 משפטים). השתמש בשפה של חובבי פיפ"א (מילים כמו "סוואט", "מטא", "סקיל", "גליץ'"). 
תענה בעברית בלבד. שים דגש על יריבויות היסטוריות אם אתה מזהה שמות חוזרים.`,
      },
    });
    return response.text || "אין פרשנות כרגע...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "נראה שכתב הספורט שלנו יצא להפסקת מחצית.";
  }
};