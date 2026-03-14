import json
import logging
import os
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

_llm = ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0,
    anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

# --- Query chain ---

SYSTEM_PROMPT = """You are a smart notes assistant. You help users find relevant notes and tasks based on their queries.

Given a list of notes/tasks and a user query, identify which are most relevant.

Each entry may include:
- ID, Type (note/task), Content
- Remind At: the scheduled datetime for a task (ISO 8601). For time-based queries (e.g. "this week", "tomorrow", "next month"), prioritise matching the Remind At field over the content text.

Today's date is {today}.

You MUST respond with ONLY valid JSON in this exact format:
{{
  "relevant_note_ids": [1, 2, 3],
  "explanation": "Brief explanation of why these notes are relevant"
}}

If no notes are relevant, return:
{{
  "relevant_note_ids": [],
  "explanation": "No notes found matching your query"
}}

Do not include any text outside the JSON object."""

NOTE_QUERY_TEMPLATE = """Here are all the available notes and tasks:

{notes_context}

User query: {query}

Return the IDs of relevant notes as JSON."""

chain = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", NOTE_QUERY_TEMPLATE),
]) | _llm | StrOutputParser()


# --- Classification chain ---

CLASSIFY_SYSTEM_PROMPT = """You are a smart assistant that classifies note content.

Given the content of a note, extract the following fields and respond with ONLY valid JSON:
{{
  "type": "note" or "task",
  "remind_at": "ISO 8601 datetime string" or null
}}

Guidelines:
- type: use "task" if the content describes something to do (action items, todos, reminders to act). Use "note" for everything else.
- remind_at: if a specific future date/time is mentioned, return it as an ISO 8601 string (e.g. "2026-03-15T09:00:00"). Use null if no specific time is mentioned. Today's date is {today}.

Do not include any text outside the JSON object."""

CLASSIFY_HUMAN_TEMPLATE = """Note content:
{content}"""

classify_chain = ChatPromptTemplate.from_messages([
    ("system", CLASSIFY_SYSTEM_PROMPT),
    ("human", CLASSIFY_HUMAN_TEMPLATE),
]) | _llm | StrOutputParser()

# --- Tagging chain ---

TAG_SYSTEM_PROMPT = """You are a smart assistant that generates concise tags for notes and tasks.

Given the content of a note or task, return 2-5 relevant tags as ONLY valid JSON:
{{
  "tags": ["tag1", "tag2"]
}}

Guidelines:
- Tags must be lowercase, 1-2 words, use hyphens instead of spaces (e.g. "follow-up", "work", "finance")
- Be specific but reusable across many notes
- Do not include any text outside the JSON object."""

TAG_HUMAN_TEMPLATE = """Note content:
{content}"""

tag_chain = ChatPromptTemplate.from_messages([
    ("system", TAG_SYSTEM_PROMPT),
    ("human", TAG_HUMAN_TEMPLATE),
]) | _llm | StrOutputParser()


def _parse_json(raw_response):
    text = raw_response.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def find_relevant_notes(notes, query):
    if not notes:
        return [], "No notes available to search."

    from datetime import date
    today = date.today().isoformat()

    def _note_context(note):
        lines = [f"ID: {note.id}", f"Type: {note.type}", f"Content: {note.content}"]
        if note.remind_at:
            lines.append(f"Remind At: {note.remind_at.isoformat()}")
        return "\n".join(lines)

    notes_context = "\n\n".join([_note_context(n) for n in notes])

    raw_response = chain.invoke({
        "notes_context": notes_context,
        "query": query,
        "today": today,
    })

    try:
        result = _parse_json(raw_response)
        relevant_ids = result.get("relevant_note_ids", [])
        explanation = result.get("explanation", "")
    except (json.JSONDecodeError, AttributeError):
        logger.error("Failed to parse AI response: %s", raw_response)
        relevant_ids = []
        explanation = "Could not parse AI response. Please try again."

    return relevant_ids, explanation


def classify_note(content):
    """Return a dict with type, urgent, important, remind_at inferred from content.

    Falls back to safe defaults on any error so note creation never fails.
    """
    from datetime import date
    today = date.today().isoformat()

    try:
        raw_response = classify_chain.invoke({"content": content, "today": today})
        result = _parse_json(raw_response)
        return {
            "type": result.get("type", "note") if result.get("type") in ("note", "task") else "note",
            "remind_at": result.get("remind_at") or None,
        }
    except Exception:
        logger.exception("classify_note failed; using defaults")
        return {"type": "note", "remind_at": None}


def tag_note(content):
    """Return a list of lowercase tag name strings inferred from content.

    Falls back to an empty list on any error.
    """
    try:
        raw_response = tag_chain.invoke({"content": content})
        result = _parse_json(raw_response)
        tags = result.get("tags", [])
        return [t.lower().strip() for t in tags if isinstance(t, str) and t.strip()]
    except Exception:
        logger.exception("tag_note failed; returning no tags")
        return []
