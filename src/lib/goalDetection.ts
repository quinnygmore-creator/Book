/**
 * Sends an entry's text + the user's goals to the `detect-goals` Edge
 * Function and returns the ids of goals it links to. Best-effort: the
 * caller should treat failures as "no links" rather than blocking.
 */
import { config, isGoalDetectionConfigured } from '../config';

export class GoalDetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoalDetectionError';
  }
}

export async function detectGoals(
  text: string,
  goals: { id: string; title: string }[]
): Promise<string[]> {
  if (!isGoalDetectionConfigured()) {
    throw new GoalDetectionError('Goal detection isn’t configured.');
  }
  if (!text.trim() || goals.length === 0) {
    return [];
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${config.supabaseAnonKey}`;
    headers['apikey'] = config.supabaseAnonKey;
  }

  let resp: Response;
  try {
    resp = await fetch(config.detectGoalsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, goals }),
    });
  } catch {
    throw new GoalDetectionError('Couldn’t reach the goal-detection service.');
  }

  const rawBody = await resp.text();
  if (!resp.ok) {
    throw new GoalDetectionError('Goal detection failed.');
  }

  try {
    const data = JSON.parse(rawBody);
    return Array.isArray(data.goalIds) ? data.goalIds : [];
  } catch {
    throw new GoalDetectionError('Unexpected response from goal detection.');
  }
}
