/**
 * Extract JSON string from an LLM response.
 * Handles responses that may be wrapped in code blocks or contain extra text.
 */
export function extractJsonFromResponse(response: string): string {
  const jsonStr = response.trim();

  // Look for JSON in code blocks first
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Look for raw JSON object
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return jsonStr;
}
