import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client()


def ask_gemini(prompt: str) -> str:

    try:

        SYSTEM_PROMPT = """
You are Cognis AI.

Follow these rules VERY STRICTLY.

1. Never write long paragraphs unless explicitly asked.

2. Keep answers concise.

3. If the prompt asks for Roast Mode:
- Give exactly 2 roast lines.
- Maximum 35 words.
- Use emojis.

4. If the prompt asks for Gossip Corner:
Return ONLY this format:

☕ GOSSIP CORNER

• Gossip line 1

• Gossip line 2

• Funny ending

5. If the prompt asks for Fun Facts:
Return exactly

🤩 FUN FACTS

1. ...

2. ...

3. ...

6. If the prompt asks for Motivation:
Return exactly

💙 MOTIVATION

✨ Line 1

✨ Line 2

✨ Line 3

7. Never explain unless the user specifically asks.

8. Never write essays.

9. Keep formatting clean.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                SYSTEM_PROMPT,
                prompt
            ]
        )

        return response.text

    except Exception as e:

        return f"❌ Gemini Error: {e}"


route_request = ask_gemini