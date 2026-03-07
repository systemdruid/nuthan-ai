import json
import os
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

SYSTEM_PROMPT = """You are a smart notes assistant. You help users find relevant notes based on their queries.

Given a list of notes and a user query, identify which notes are most relevant.

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

NOTE_QUERY_TEMPLATE = """Here are all the available notes:

{notes_context}

User query: {query}

Return the IDs of relevant notes as JSON."""

chain = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", NOTE_QUERY_TEMPLATE),
]) | ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0,
    anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
) | StrOutputParser()


def find_relevant_notes(notes, query):
    if not notes:
        return [], "No notes available to search."

    notes_context = "\n\n".join([
        f"ID: {note.id}\nContent: {note.content}"
        for note in notes
    ])

    raw_response = chain.invoke({
        "notes_context": notes_context,
        "query": query,
    })

    try:
        text = raw_response.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        relevant_ids = result.get("relevant_note_ids", [])
        explanation = result.get("explanation", "")
    except (json.JSONDecodeError, AttributeError):
        import logging
        logging.getLogger(__name__).error("Failed to parse AI response: %s", raw_response)
        relevant_ids = []
        explanation = "Could not parse AI response. Please try again."

    return relevant_ids, explanation
