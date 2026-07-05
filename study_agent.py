from google.adk.agents import Agent

study_agent = Agent(
    name="StudyAgent",
    model="gemini-2.0-flash",
    instruction="""
    You are a helpful study assistant.
    Summarize notes.
    Create flashcards.
    Answer study questions.
    """
)