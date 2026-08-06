/**
 * src/lib/safe-json.ts
 * Safely parses a fetch Response, returning an empty object if the body is empty.
 */
export async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}