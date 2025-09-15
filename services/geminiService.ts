
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { EmployeeSkill, RoleExpectation, CalculatedGap, AISkillAnalysisResults, TrainingRecommendation, HiringSuggestion, UpskillingPriority, RoleReadinessSummary } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

function parseAIJsonResponse(jsonStr: string): AISkillAnalysisResults {
  let cleanJsonStr = jsonStr.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = cleanJsonStr.match(fenceRegex);
  if (match && match[2]) {
    cleanJsonStr = match[2].trim();
  }

  try {
    const parsed = JSON.parse(cleanJsonStr);
    // Basic validation of structure
    const results: AISkillAnalysisResults = {};
    if (parsed.overallSummary && typeof parsed.overallSummary === 'string') results.overallSummary = parsed.overallSummary;
    if (Array.isArray(parsed.trainingRecommendations)) results.trainingRecommendations = parsed.trainingRecommendations as TrainingRecommendation[];
    if (Array.isArray(parsed.hiringSuggestions)) results.hiringSuggestions = parsed.hiringSuggestions as HiringSuggestion[];
    if (Array.isArray(parsed.upskillingPriorities)) results.upskillingPriorities = parsed.upskillingPriorities as UpskillingPriority[];
    if (Array.isArray(parsed.roleReadinessSummaries)) results.roleReadinessSummaries = parsed.roleReadinessSummaries as RoleReadinessSummary[];
    return results;
  } catch (e) {
    console.error("Failed to parse JSON response from AI:", e, "Raw response:", jsonStr);
    throw new Error(`AI returned an invalid JSON response. Please check the console for details. Raw output: ${jsonStr.substring(0,1000)}`);
  }
}


export const getAIInsights = async (
  employeeSkills: EmployeeSkill[],
  roleExpectations: RoleExpectation[],
  calculatedGaps: CalculatedGap[]
): Promise<AISkillAnalysisResults> => {
  if (!ai) {
    console.warn("Gemini API client not initialized. Returning empty AI results.");
    return { 
      overallSummary: "AI analysis is disabled as the API key is not configured.",
      trainingRecommendations: [],
      hiringSuggestions: [],
      upskillingPriorities: [],
      roleReadinessSummaries: []
    };
  }

  // To keep the prompt manageable, we might send summaries or samples of data
  // For this example, let's send a limited number of gaps for training recommendations
  // and focus on overall trends for other suggestions.

  const sampleGapsForTraining = calculatedGaps
    .filter(g => g.gap_type === 'deficient' || g.gap_type === 'missing')
    .slice(0, 20); // Send up to 20 gaps for specific training suggestions

  const uniqueRolesWithGaps = [...new Set(calculatedGaps.filter(g => g.gap_type === 'deficient' || g.gap_type === 'missing').map(g => g.role))];
  const uniqueSkillsWithGaps = [...new Set(calculatedGaps.filter(g => g.gap_type === 'deficient' || g.gap_type === 'missing').map(g => g.skill))];


  const prompt = `
    You are an AI assistant specialized in workforce skills gap analysis.
    Analyze the provided employee skills data, role requirements, and calculated skill gaps to provide actionable insights.

    Context:
    - Employee Skills Summary: ${employeeSkills.length} employees, across various departments and roles. Key skills being tracked.
    - Role Expectations Summary: ${roleExpectations.length} role requirements defined.
    - Calculated Skill Gaps Summary: ${calculatedGaps.length} total potential gaps identified.
      - Roles with notable gaps: ${uniqueRolesWithGaps.slice(0,5).join(', ') || 'N/A'}
      - Skills with notable gaps: ${uniqueSkillsWithGaps.slice(0,5).join(', ') || 'N/A'}

    Employee Data Snippet (Illustrative - actual data may vary):
    ${JSON.stringify(employeeSkills.slice(0,3))}

    Role Requirements Snippet (Illustrative):
    ${JSON.stringify(roleExpectations.slice(0,3))}

    Calculated Gaps Snippet (Illustrative - showing employees needing improvement):
    ${JSON.stringify(sampleGapsForTraining.slice(0,3))}


    Based on the full (but summarized for this prompt) dataset analysis, provide the following in a single JSON object:

    1.  "overallSummary": (string) A concise (2-3 sentences) high-level summary of the overall skill landscape, identifying 1-2 common themes or critical areas of concern.
    2.  "trainingRecommendations": (array of objects) For up to 5 employees or roles with significant skill gaps (from the provided 'Calculated Gaps Snippet' or general trends), suggest specific training modules or areas of focus.
        Format: [{ "employee_id": "...", "name": "...", "role": "...", "suggestions": ["Specific training for Skill A", "Workshop on Skill B"] }, ...]
        If no specific employee data is available or to generalize: [{ "role": "Specific Role", "suggestions": ["General training for Skill X for this role"]}]
    3.  "hiringSuggestions": (array of objects) Identify up to 2-3 roles where skill gaps are particularly pronounced AND hard to train internally, suggesting hiring new talent. For these roles, describe the ideal candidate profile and 2-3 key skills to look for.
        Format: [{ "role": "...", "hiring_suggestion": "Consider hiring externally due to significant gaps in X and Y.", "profile_keywords": ["Keyword1", "Keyword2"] }, ...]
    4.  "upskillingPriorities": (array of objects) List the top 2-3 skills that should be prioritized for company-wide upskilling initiatives, with a brief justification for each.
        Format: [{ "skill": "...", "justification": "..." }, ...]
    5.  "roleReadinessSummaries": (array of objects) For up to 3-5 key roles (from 'Roles with notable gaps' or general analysis), provide a brief (1 sentence) summary of their overall readiness based on current employee skills.
        Example: [{ "role": "Software Engineer", "readiness_summary": "Moderately ready. Strengths in Python, but noticeable gaps in cloud technologies." }, ...]

    Ensure the output is a valid JSON object with exactly these keys. Focus on actionable and concise recommendations.
    If data is insufficient for a category, provide an empty array or a statement indicating insufficiency within the string value where appropriate.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17", // Ensure this is a valid and available model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // temperature: 0.7 (default) - adjust if needed for creativity vs. consistency
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("AI returned an empty response.");
    }
    return parseAIJsonResponse(responseText);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Gemini API request failed: API key not valid. Please check your API_KEY environment variable.");
    }
    throw new Error(`Failed to get AI insights: ${error instanceof Error ? error.message : String(error)}`);
  }
};
