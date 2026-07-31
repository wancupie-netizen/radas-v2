# RADAS Edge Functions

## generate-research

Authenticated staff-only function that:

1. validates the Supabase user session and role;
2. loads the stored product facts;
3. records a generation run;
4. requests a structured draft from OpenAI;
5. stores the AI output and token/cost metadata;
6. changes research status to `ai_generated` without publishing.

Required secret: `OPENAI_API_KEY`.