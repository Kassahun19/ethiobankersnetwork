import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeCV = async (cvText: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this CV for a banking professional in Ethiopia. Provide a score out of 100 and 3 specific suggestions for improvement. Return as JSON.
    
    CV Text: ${cvText}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
};

export const getJobRecommendations = async (userProfile: any, jobs: any[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this user profile and available jobs, recommend the top 3 jobs. Return as JSON array of job IDs.
    
    User Profile: ${JSON.stringify(userProfile)}
    Available Jobs: ${JSON.stringify(jobs.map(j => ({ id: j.id, title: j.title, bank: j.bank })))}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
};
