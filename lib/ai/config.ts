/**
 * The only model this app talks to. Fixed on the server; nothing a client
 * sends can change it.
 */
export const AI_MODEL = "google/gemini-3.1-flash-lite";
export const AI_MODEL_LABEL = "Gemini 3.1 Flash Lite";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Request limits (characters) so one call can't run up a huge bill. */
export const MAX_SYSTEM_CHARS = 120_000;
export const MAX_MESSAGES_CHARS = 60_000;
export const MAX_MESSAGES = 40;
export const MAX_OUTPUT_TOKENS = 4096;

/** Settings key for a user-supplied OpenRouter key (never backed up). */
export const AI_KEY_SETTING = "openrouterKey";
