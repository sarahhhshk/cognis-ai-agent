from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import os
from werkzeug.utils import secure_filename
import docx

# Import agent coordinator
from agents.coordinator import route_request

load_dotenv()

app = Flask(__name__)

# =============================
# CONFIGURATION
# =============================

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
uploaded_syllabus = ""


# =============================
# HELPER FUNCTION
# =============================

def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# =============================
# HOME PAGE
# =============================

@app.route("/")
def home():
    return render_template("index.html")


# =============================
# UPLOAD SYLLABUS
# =============================

@app.route("/upload", methods=["POST"])
def upload_file():

    global uploaded_syllabus

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "No file selected."
        })

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "Choose a file."
        })

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "message": "Unsupported file type."
        })

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    file.save(filepath)
    extension = filename.rsplit(".", 1)[1].lower()
    # Maximum upload size 10 MB
    if os.path.getsize(filepath) > 10 * 1024 * 1024:
       os.remove(filepath)
       return jsonify({
            "success": False,
            "message": "File too large."
       })

    try:

        if extension == "txt":

            with open(filepath, "r", encoding="utf-8") as f:
                uploaded_syllabus = f.read()

        elif extension == "docx":

            document = docx.Document(filepath)

            uploaded_syllabus = "\n".join(
                p.text for p in document.paragraphs
            )

        elif extension == "pdf":

            reader = PdfReader(filepath)

            uploaded_syllabus = ""

            for page in reader.pages:
                text = page.extract_text()

                if text:
                    uploaded_syllabus += text + "\n"

        print(uploaded_syllabus[:1000])

        return jsonify({
            "success": True,
            "message": "Syllabus uploaded successfully!"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        })
# =============================
# CHAT ENDPOINT
# =============================

@app.route("/api/chat", methods=["POST"])
def chat():

    user_message = request.form.get("message", "")
    gossip_mode = request.form.get(
        "gossip_mode",
        "false"
    ) == "true"

    uploaded_file = request.files.get("image")

    if not user_message and not uploaded_file:
        return jsonify({
            "reply": "I didn't receive any text or images! 🤔"
        }), 400

    try:

        if gossip_mode:
            prompt = (
                "[MODE: Sarcastic/Gossip study buddy] "
                + user_message
            )
        else:
            prompt = user_message

        ai_reply = route_request(prompt)

        return jsonify({
            "reply": ai_reply
        })

    except Exception as e:

        print(e)

        return jsonify({
            "reply": f"❌ {str(e)}"
        }), 500


# =============================
# SYLLABUS TOOLS
# =============================

@app.route("/api/analyze-syllabus", methods=["POST"])
def analyze_syllabus():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received."
        }), 400

    global uploaded_syllabus

    syllabus_text = uploaded_syllabus

    if not syllabus_text:
        syllabus_text = data.get("content", "")

    feature = data.get("feature", "")

    if feature == "summary":
        prompt = (
            "Create clean notes from:\n\n"
            + syllabus_text
        )

    elif feature == "mind_map":
        prompt = (
            "Create a text mind map from:\n\n"
            + syllabus_text
        )

    elif feature == "topics":
        prompt = (
            "Extract important exam topics:\n\n"
            + syllabus_text
        )

    elif feature == "flashcards":
        prompt = (
            "Generate flashcards:\n\n"
            + syllabus_text
        )

    else:
        prompt = syllabus_text

    try:
        print("\n========== PROMPT ==========")
        print(prompt[:3000])
        print("============================")
        
        result = route_request(prompt)

        return jsonify({
            "result": result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =============================
# FLASHCARDS
# =============================

@app.route("/api/flashcards", methods=["POST"])
def flashcards():

    global uploaded_syllabus

    if not uploaded_syllabus:
        return jsonify({
            "error": "Please upload a syllabus first."
        }), 400

    prompt = f"""
Create interactive flashcards from this syllabus.

Format exactly like this:

Q: Question
A: Answer

Generate at least 10 flashcards.

Syllabus:

{uploaded_syllabus}
"""

    try:

        result = route_request(prompt)

        return jsonify({
            "result": result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500        

# =============================
# FUN ZONE API
# =============================

@app.route("/api/fun", methods=["POST"])
def fun_zone():

    data = request.get_json()

    mode = data.get("mode", "")
    topic = data.get("topic", "")

    if mode == "roast":

        prompt = f"""
Roast the study topic "{topic}" in a funny Gen-Z style.

Return ONLY this exact format.

👹 ROAST MODE

😂 Line 1

😂 Line 2

Rules:

- Maximum 2 lines.
- Maximum 12 words per line.
- Use emojis.
- No explanation.
- No teaching.
- No paragraphs.
- No introduction.
- Output NOTHING except the format above.
"""

    elif mode == "gossip":

        prompt = f"""
Pretend "{topic}" is a college student.

Return ONLY this format.

☕ GOSSIP CORNER

📰 Gossip

• Line 1

• Line 2

🤭 Ending

• Funny ending

Rules:

- Maximum 3 bullet points.
- No explanation.
- No paragraphs.
- Output ONLY this format.
"""

    elif mode == "facts":

        prompt = f"""
Give ONLY 3 fun facts about "{topic}".

Return ONLY this format.

🤩 FUN FACTS

1. Fact one

2. Fact two

3. Fact three

Rules:

- One sentence each.
- Maximum 12 words each.
- No introduction.
- No paragraphs.
"""

    elif mode == "motivation":

        prompt = f"""
Motivate someone studying "{topic}".

Return ONLY this format.

💙 MOTIVATION BOOST

✨ Line 1

✨ Line 2

✨ Line 3

Rules:

- Maximum 3 lines.
- Maximum 10 words per line.
- No explanation.
- No paragraphs.
"""

    else:

        prompt = topic

    try:

        result = route_request(prompt)

        return jsonify({
            "result": result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
# ==========================================
# NOTES
# ==========================================

@app.route("/api/notes", methods=["POST"])
def notes():

    data = request.get_json()
    topic = data.get("topic", "")

    prompt = f"""
You are a study notes generator.

Topic:
{topic}

IMPORTANT:

Return ONLY the template below.

DO NOT write paragraphs.
DO NOT explain.
DO NOT add introductions.
DO NOT add conclusions.

Exactly follow this format.

📝 NOTES
━━━━━━━━━━━━━━━━━━━━

📖 Definition
• ...

⭐ Key Concepts
• ...
• ...
• ...
• ...

✅ Advantages
• ...
• ...

❌ Disadvantages
• ...
• ...

💼 Applications
• ...
• ...
• ...

📝 Exam Tips
• ...
• ...
• ...

Every point must be ONE LINE ONLY.

Maximum 8 words per bullet.

Output ONLY the notes.
"""

    try:

        result = route_request(prompt)

        return jsonify({
            "result": result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
# ==========================================
# QUIZ
# ==========================================

@app.route("/api/quiz", methods=["POST"])
def quiz():

    data = request.get_json()

    topic = data.get("topic", "")

    prompt = f"""
You are an expert quiz generator.

Topic:
{topic}

Return ONLY this format.

🧠 AI QUIZ
━━━━━━━━━━━━━━━━━━━━━━

Q1.
Question

A) Option

B) Option

C) Option

D) Option

✅ Answer: A

━━━━━━━━━━━━━━━━━━━━━━

Q2.
Question

A) Option

B) Option

C) Option

D) Option

✅ Answer: C

━━━━━━━━━━━━━━━━━━━━━━

Q3.
Question

A) Option

B) Option

C) Option

D) Option

✅ Answer: D

Generate exactly 10 questions.

Rules:

• No explanations.

• Leave one blank line between questions.

• Only MCQs.

• No paragraphs.

• Output ONLY this format.
"""

    try:

        result = route_request(prompt)

        return jsonify({
            "result": result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
# ==========================================
# PLANNER
# ==========================================

@app.route("/api/planner", methods=["POST"])
def planner():

    data = request.get_json()

    topic = data.get("topic", "")
    exam_date = data.get("exam_date", "")

    prompt = f"""
You are an expert study planner.

Subject:
{topic}

Exam Date:
{exam_date}

Return ONLY this format.

📅 STUDY PLANNER
━━━━━━━━━━━━━━━━━━━━━━

🎯 Goal
Complete {topic} before {exam_date}

━━━━━━━━━━━━━━━━━━━━━━

📚 WEEK 1

Monday
• Study basics

Tuesday
• Learn concepts

Wednesday
• Practice questions

Thursday
• Revision

Friday
• Mock test

Saturday
• PYQs

Sunday
• Revise

━━━━━━━━━━━━━━━━━━━━━━

📚 FINAL REVISION

✅ Important formulas

✅ Important topics

✅ Previous year questions

✅ Sleep well before exam

Rules:

• No paragraphs.
• Bullet points only.
• Keep everything neat.
• Use emojis.
"""

    try:

        result = route_request(prompt)

        return jsonify({
            "result": result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
# =============================
# RUN APP
# =============================

import os

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )