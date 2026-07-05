document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. CHAT MESSAGING ENGINE & MULTIMODAL UPLOAD
    // -------------------------------------------------------------
    const chatInputField = document.getElementById("chat-input-field");
    const submitChatBtn = document.querySelector(".submit-chat-btn");
    const chatMessagesBox = document.querySelector(".chat-messages-box");
    const gossipToggle = document.getElementById("gossip-toggle");
    const suggestedPills = document.querySelectorAll(".suggested-pills .pill");
    const imageUploadInput = document.getElementById("chat-image-upload");
    const syllabusFile = document.getElementById("syllabus-file");
    const uploadBtn = document.getElementById("upload-btn");
    const funItems = document.querySelectorAll(".fun-item");

    console.log(funItems);
    console.log("Found", funItems.length, "fun items");
if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
        syllabusFile.click();
    });
}

    let gossipModeActive = false;

    // Toggle Gossip Mode switch on/off
    if (gossipToggle) {
        gossipToggle.addEventListener("click", () => {
            gossipModeActive = !gossipModeActive;
            gossipToggle.classList.toggle("active-mode", gossipModeActive);
            gossipToggle.textContent = gossipModeActive ? "Disable Mode" : "Enable Mode";
            gossipToggle.style.background = gossipModeActive ? "var(--neon-orange)" : "";
            
            // 🤖 Animate the center face matrix instantly upon toggling
            updateRobotFace(gossipModeActive ? 'excited' : 'thinking');
            
            // Sync up manual mood chips below the stage layout
            const targetMoodClass = gossipModeActive ? "excited" : "thinking";
            moodItems.forEach(m => {
                m.classList.remove("active");
                if (m.textContent.toLowerCase().includes(targetMoodClass)) {
                    m.classList.add("active");
                }
            });
        });
    }

    // Function to append text or image bubbles on screen
    const appendMessage = (text, sender = "user", isImage = false) => {
        const row = document.createElement("div");
        row.classList.add("chat-row", sender);
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (sender === "user") {
            if (isImage) {
                row.innerHTML = `
                    <div class="msg-wrapper">
                        <div class="msg-bubble" style="padding: 8px; background: rgba(168, 85, 247, 0.1);">
                            <img src="${text}" alt="Uploaded Screenshot" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid #a855f7; display: block;">
                        </div>
                        <div class="msg-meta">${currentTime} <i class="fa-solid fa-check-double read-check"></i></div>
                    </div>
                `;
            } else {
                row.innerHTML = `
                    <div class="msg-wrapper">
                        <div class="msg-bubble">${text}</div>
                        <div class="msg-meta">${currentTime} <i class="fa-solid fa-check-double read-check"></i></div>
                    </div>
                `;
            }
        } else {
            row.innerHTML = `
                <div class="chat-avatar-bot" style="display: flex; align-items: center; justify-content: center; background: #a855f7; color: #fff; border-radius: 50%; width: 35px; height: 35px; min-width: 35px;">
                    <i class="fa-solid fa-brain" style="font-size: 16px;"></i>
                </div>
                <div class="msg-wrapper">
                    <div class="msg-bubble">${text}</div>
                </div>
            `;
        }
        chatMessagesBox.appendChild(row);
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    };

    // Submits text and files together using FormData
    const handleSendMessage = async () => {
        const messageText = chatInputField.value.trim();
        const hasFile = imageUploadInput && imageUploadInput.files[0];

        if (!messageText && !hasFile) return;

        // If an image is selected, display it locally on screen first
        if (hasFile) {
            const localImgUrl = URL.createObjectURL(imageUploadInput.files[0]);
            appendMessage(localImgUrl, "user", true);
        }

        // Display user text if typed
        if (messageText) {
            appendMessage(messageText, "user", false);
        }

        chatInputField.value = ""; // clear message entry field
        updateRobotFace('thinking'); // animate robot state to processing

        // Construct standard multipart data for our Flask endpoint
        const formData = new FormData();
        formData.append('message', messageText);
        formData.append('gossip_mode', gossipModeActive);
        if (hasFile) {
            formData.append('image', imageUploadInput.files[0]);
        }

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                body: formData // Browser configures multi-part content borders on the fly
            });

            const data = await response.json();
            appendMessage(data.reply, "bot");
            
            // Switch avatar look depending on your dashboard configurations
            updateRobotFace(gossipModeActive ? 'excited' : 'teaching');

        } catch (error) {
            console.error("API Error:", error);
            appendMessage("System offline. Make sure your Flask app is running! 🔌", "bot");
            updateRobotFace('happy');
        } finally {
            if (imageUploadInput) imageUploadInput.value = ""; // flush input state
        }
    };

    // Trigger hooks for clicks or enter keys
    if (submitChatBtn) submitChatBtn.addEventListener("click", handleSendMessage);
    if (chatInputField) {
        chatInputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSendMessage();
        });
    }

    if (imageUploadInput) {
        imageUploadInput.addEventListener("change", () => {
            if (imageUploadInput.files[0]) {
                // Instantly send if user clips a file inside the field deck
                handleSendMessage();
            }
        });
    }

    suggestedPills.forEach(pill => {
        pill.addEventListener("click", () => {
            chatInputField.value = pill.textContent;
            handleSendMessage();
        });
    });

    // -------------------------------------------------------------
    // 2. SIDEBAR TAB NAVIGATION ROUTING
    // -------------------------------------------------------------
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            tabLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(panel => panel.classList.add('hidden'));
            
            const targetTab = this.getAttribute('data-tab');
        
            const targetPanel = document.getElementById(`${targetTab}-panel`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        });
    });

    // -------------------------------------------------------------
    // 3. SYLLABUS EXTRACTION TOOLS
    // -------------------------------------------------------------
    const toolItems = document.querySelectorAll('.sub-tool-links li');
    toolItems.forEach(toolItem => {
        toolItem.style.cursor = 'pointer';
        const notesPanel = document.getElementById("notes-panel");
        toolItem.addEventListener('click', async function() {
            const heading = this.querySelector("strong").innerText;
            const headingText = this.querySelector('strong').innerText.toLowerCase();
            if (heading.includes("Flash")) {

    document.querySelector('[data-tab="notes"]').click();

    notesPanel.innerHTML = `
        <h2 style="color:#a855f7">
        Generating Flashcards...
        </h2>
    `;

    const res = await fetch("/api/flashcards", {
        method: "POST"
    });

    const data = await res.json();

    notesPanel.innerHTML = `
        <h2 style="color:#a855f7">
        🃏 AI Flashcards
        </h2>

        <div style="
        white-space:pre-wrap;
        background:#14162b;
        padding:20px;
        border-radius:12px;
        margin-top:15px;">
        ${data.result}
        </div>
    `;

    return;
}
            let featureKey = 'summary';
            
            if (headingText.includes('mind')) featureKey = 'mind_map';
            if (headingText.includes('important')) featureKey = 'topics';
            if (headingText.includes('flash')) featureKey = 'flashcards';
            // Flashcards use their own API
if (featureKey === "flashcards") {

    const res = await fetch("/api/flashcards", {
        method: "POST"
    });

    const data = await res.json();

    notesPanel.innerHTML = `
        <h2 style="color:#a855f7;">🃏 AI Flashcards</h2>
        <div style="background:#13162c;
                    padding:25px;
                    border-radius:12px;
                    white-space:pre-wrap;
                    line-height:1.8;">
            ${data.result || data.error}
        </div>
    `;

    return;
}
            
            tabLinks.forEach(l => l.classList.remove('active'));
            const notesTabLink = document.querySelector('[data-tab="notes"]');
            if (notesTabLink) notesTabLink.classList.add('active');
            
            tabContents.forEach(panel => panel.classList.add('hidden'));
            const notesPanel = document.getElementById("notes-panel");

            if (notesPanel) {
                notesPanel.classList.remove('hidden');
                notesPanel.innerHTML = `
                    <h2 style="color: #a855f7;"><i class="fa-solid fa-spinner fa-spin"></i> Cognis is analyzing...</h2>
                    <p style="color: #9ca3af; margin-top: 10px;">Extracting high-yield breakdowns from your syllabus details...</p>
                `;
            }

            try {
                const res = await fetch('/api/analyze-syllabus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
    feature: featureKey
})
                });
                const data = await res.json();
                
                if (notesPanel) {
                    notesPanel.innerHTML = `
                        <h2 style="color: #a855f7;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI ${headingText.toUpperCase()}</h2>
                        <div style="background: #13162c; border-radius: 12px; padding: 25px; margin-top: 15px; border: 1px solid #2a2f5c; line-height: 1.7; white-space: pre-wrap; color: #e5e7eb;">
                            ${data.result || data.error}
                        </div>
                    `;
                }
            } catch (err) {
                console.error(err);
                if (notesPanel) {
                    notesPanel.innerHTML = `<h2 style="color: #ef4444;">❌ Failed to compile syllabus analysis request details.</h2>`;
                }
            }
        });
    });

    // -------------------------------------------------------------
    // 4. GIANT AVATAR FACE VISUAL CONTROLLER
    // -------------------------------------------------------------
    const mainRobotContainer = document.querySelector(".main-robot");
    const moodItems = document.querySelectorAll(".mood-selectors .mood-item");

    const faceMatrices = {
    happy: '<i class="fa-solid fa-face-smile-beam" style="font-size:70px;color:#10b981;"></i>',
    thinking: '<i class="fa-solid fa-face-grin-stars" style="font-size:70px;color:#a855f7;"></i>',
    excited: '<i class="fa-solid fa-face-laugh-beam" style="font-size:70px;color:#f97316;"></i>',
    teaching: '<i class="fa-solid fa-graduation-cap" style="font-size:70px;color:#06b6d4;"></i>'
};

function updateRobotFace(mood) {
    if (!mainRobotContainer) return;

    mainRobotContainer.innerHTML = faceMatrices[mood];
}

    updateRobotFace('thinking'); // Set default face matrix state

    moodItems.forEach(item => {
        item.addEventListener("click", function() {
            moodItems.forEach(m => m.classList.remove("active"));
            this.classList.add("active");

            const moodText = this.textContent.toLowerCase();
            if (moodText.includes("happy")) updateRobotFace("happy");
            if (moodText.includes("thinking")) updateRobotFace("thinking");
            if (moodText.includes("excited")) updateRobotFace("excited");
            if (moodText.includes("teaching")) updateRobotFace("teaching");
        });
    });

// ===============================
// FUN ZONE POPUP
// ===============================

const funModal = document.getElementById("funModal");

const closeFunModal = document.getElementById("closeFunModal");

const funTitle = document.getElementById("funTitle");

const funTopic = document.getElementById("funTopic");

const generateFunBtn = document.getElementById("generateFunBtn");

const funResult = document.getElementById("funResult");
const plannerDate = document.getElementById("plannerDate");

let currentMode = "";
let currentAPI = "";


// Roast
document.querySelector(".roast").parentElement.addEventListener("click", () => {

    currentMode = "roast";
    currentAPI = "/api/fun";

    funTitle.innerHTML = "👹 Roast Mode";

    funTopic.placeholder = "Enter a study topic...";

    funTopic.value = "";

    funResult.style.display = "none";

    funModal.style.display = "flex";

});


// Gossip
document.querySelector(".gossip").parentElement.addEventListener("click", () => {

    currentMode = "gossip";
    currentAPI = "/api/fun";

    funTitle.innerHTML = "☕ Gossip Corner";

    funTopic.placeholder = "Enter any topic...";

    funTopic.value = "";

    funResult.style.display = "none";

    funModal.style.display = "flex";

});


// Fun Facts
document.querySelector(".facts").parentElement.addEventListener("click", () => {

    currentMode = "facts";
    currentAPI = "/api/fun";

    funTitle.innerHTML = "🤩 Fun Facts";

    funTopic.placeholder = "Enter any topic...";

    funTopic.value = "";

    funResult.style.display = "none";

    funModal.style.display = "flex";

});


// Motivation
document.querySelector(".boost").parentElement.addEventListener("click", () => {

    currentMode = "motivation";
    currentAPI = "/api/fun";

    funTitle.innerHTML = "💙 Motivation Boost";

    funTopic.placeholder = "What are you studying?";

    funTopic.value = "";

    funResult.style.display = "none";

    funModal.style.display = "flex";

});


// Close popup

closeFunModal.onclick = function(){

    funModal.style.display = "none";

}

generateFunBtn.onclick = async function () {

    const topic = funTopic.value.trim();

    if (topic === "") {

        alert("Please enter a topic.");

        return;

    }

    generateFunBtn.disabled = true;

    generateFunBtn.innerHTML = "Generating...";

    funResult.style.display = "block";

    funResult.innerHTML = "⏳ Cognis is thinking...";

    let body = {

    topic: topic,

    mode: currentMode

};
    // Planner needs exam date
    if (currentAPI === "/api/planner") {

        body.exam_date = document.getElementById("plannerDate").value;

    }

    try {

        const response = await fetch(currentAPI, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(body)

        });

        const data = await response.json();

        funResult.innerHTML = data.result || data.error;

    }

    catch (err) {

        console.error(err);

        funResult.innerHTML = "❌ Something went wrong.";

    }

    generateFunBtn.disabled = false;

    generateFunBtn.innerHTML = "Generate";

};

// ======================================
// AI TOOLS
// ======================================

const toolModal = document.getElementById("toolModal");

const toolTitle = document.getElementById("toolTitle");

const toolTopic = document.getElementById("toolTopic");

const toolResult = document.getElementById("toolResult");

const generateToolBtn = document.getElementById("generateToolBtn");

const closeToolModal = document.getElementById("closeToolModal");

let toolAPI = "";

closeToolModal.onclick = () => {

    toolModal.style.display = "none";

}

window.onclick = function(e){

    if(e.target==toolModal){

        toolModal.style.display="none";

    }

}
document.querySelectorAll(".tab-link").forEach(item=>{

    item.addEventListener("click",function(e){

        const tab=this.dataset.tab;

        if(tab=="notes"){

            e.preventDefault();

            toolAPI="/api/notes";

            toolTitle.innerHTML="📝 AI Notes";

            toolTopic.placeholder="Enter Subject";

            plannerDate.style.display="none";

            toolResult.innerHTML="";

            toolTopic.value="";

            toolModal.style.display="flex";

        }

        if(tab=="quiz"){

            e.preventDefault();

            toolAPI="/api/quiz";

            toolTitle.innerHTML="🧠 AI Quiz";

            toolTopic.placeholder="Enter Subject";

            plannerDate.style.display="none";

            toolResult.innerHTML="";

            toolTopic.value="";

            toolModal.style.display="flex";

        }

        if(tab=="planner"){

            e.preventDefault();

            toolAPI="/api/planner";

            toolTitle.innerHTML="📅 Study Planner";

            toolTopic.placeholder="Enter Subject";

            plannerDate.style.display="block";

            toolResult.innerHTML="";

            toolTopic.value="";

            toolModal.style.display="flex";

        }

    });

});
generateToolBtn.onclick=async()=>{

    const topic=toolTopic.value.trim();

    if(topic==""){

        alert("Enter subject.");

        return;

    }

    generateToolBtn.innerHTML="Generating...";

    generateToolBtn.disabled=true;

    toolResult.innerHTML="⏳ Cognis is thinking...";

   let body = {

    topic: topic

};

    if(toolAPI=="/api/planner"){

        body.exam_date=plannerDate.value;

    }

    try{

        const response=await fetch(toolAPI,{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify(body)

        });

        const data=await response.json();

        toolResult.innerHTML = `
        <div style="
    white-space: pre-wrap;
    line-height: 2;
    font-size: 15px;
    color: #ffffff;
        ">
${data.result || data.error}
</div>
`;
    }

    catch(err){

        toolResult.innerHTML="❌ Error generating.";

    }

    generateToolBtn.innerHTML="Generate";

    generateToolBtn.disabled=false;

}
});