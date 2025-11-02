// --- 1. Global Variables & DOM Elements ---
// 💥 FIX: API Key is GONE! It's no longer needed here.
// 💥 FIX: API_URL now points to our own backend.
const API_URL = '/api/roast'; // This is our secure function

const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
// ... (rest of your DOM elements) ...
const historyList = document.getElementById('historyList');
const newChatBtn = document.getElementById('newChatBtn');
const homeBtn = document.getElementById('homeBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('aside');

const CHAT_STORAGE_KEY = 'funTalkHistorySessions';
let currentChatHistory = [];
let currentSessionId = Date.now(); 

// --- 2. API Call Function (Now points to /api/roast) ---
async function getRoastResponse(chatHistoryForAPI) {
    
    // The System Prompt is no longer needed here, the backend handles it.

    try {
        // 1. 🚀 Call OUR OWN backend, sending only the history
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // We only need to send the history, the backend adds the prompt/key
            body: JSON.stringify({ 
                history: chatHistoryForAPI 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }

        const data = await response.json();
        
        // 2. Get the text from our backend's response
        return data.text; 

    } catch (error) {
        console.error("API Call failed:", error.message);
        return `My server gussa ho gaya. (Error: ${error.message})`;
    }
}

// --- 3. Main Interaction Function (No Change) ---
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = chatInput.value.trim();
    chatInput.value = '';

    if (userInput === "") return;

    displayMessage(userInput, 'user');
    currentChatHistory.push({ role: "user", content: userInput }); 

    sendBtn.disabled = true;
    sendBtn.textContent = 'Thinking... 🤔';

    const aiResponseText = await getRoastResponse(currentChatHistory); 

    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';

    displayMessage(`🤖 Roast: ${aiResponseText}`, 'model');
    currentChatHistory.push({ role: "model", content: aiResponseText }); 

    saveChatSession();
    loadHistorySidebar();
}


// --- 4. DOM Helper Function (Correct Alignment) ---
function displayMessage(message, sender) {
    const messageDiv = document.createElement('div');

    const containerClasses = sender === 'user' ? 'flex justify-end' : 'flex justify-start';
    const bubbleClasses = sender === 'user'
        ? 'bg-green-600 text-white'
        : 'bg-gray-200 text-gray-800 border border-green-500';

    messageDiv.className = `w-full ${containerClasses}`; 
    
    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-xl max-w-sm shadow ${bubbleClasses} whitespace-pre-wrap`; 
    bubble.textContent = message;
    
    messageDiv.appendChild(bubble);
    chatWindow.appendChild(messageDiv);
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


// --- 5. History and Navigation Logic (No Change) ---

// --- A. Save/New Chat ---
newChatBtn.addEventListener('click', startNewChat);

function saveChatSession() {
    if (currentChatHistory.length === 0) return;
    const sessions = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    const newSessions = sessions.filter(s => s.id !== currentSessionId);
    newSessions.unshift({
        id: currentSessionId,
        title: currentChatHistory[0].content.substring(0, 25) + "...",
        messages: currentChatHistory
    });
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(newSessions.slice(0, 10)));
}

function startNewChat() {
    saveChatSession();
    currentChatHistory = [];
    currentSessionId = Date.now();
    chatWindow.innerHTML = '<div class="p-3 bg-gray-100 rounded-lg max-w-sm self-start">Welcome to The Fun Talk! Ask me something funny.</div>';
    loadHistorySidebar();
}

// --- B. Load History Sidebar ---
function loadHistorySidebar() {
    const sessions = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    historyList.innerHTML = '<p class="text-green-400 font-semibold mb-2">Your recent talks:</p>';

    sessions.forEach(session => {
        const itemContainer = document.createElement('div');
        itemContainer.className = "flex justify-between items-center p-1 hover:bg-gray-700 rounded transition";

        const a = document.createElement('a');
        a.href = "#";
        a.textContent = session.title;
        a.className = "text-white text-sm truncate cursor-pointer flex-1";
        
        a.onclick = (e) => {
            e.preventDefault();
            loadSession(session.id);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&#8942;'; 
        deleteBtn.className = "text-gray-400 hover:text-red-400 ml-2 transition text-lg"; 
        
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); 
            deleteHistory(session.id);
        }

        itemContainer.appendChild(a);
        itemContainer.appendChild(deleteBtn);
        historyList.appendChild(itemContainer);
    });
}

// --- C. Load Specific Session ---
function loadSession(id) {
    saveChatSession(); 
    const sessions = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    const selectedSession = sessions.find(s => s.id === id);
    if (selectedSession) {
        currentChatHistory = selectedSession.messages;
        currentSessionId = selectedSession.id;
        chatWindow.innerHTML = '';
        currentChatHistory.forEach(msg => {
            const sender = msg.role === 'model' ? 'model' : 'user';
            displayMessage(msg.content, sender); 
        });
    }
}

// --- F. Delete History Function ---
function deleteHistory(idToDelete) {
    if (!confirm("Are you sure you want to delete this chat history?")) {
        return;
    }
    let sessions = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    sessions = sessions.filter(s => s.id !== idToDelete);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
    if (idToDelete === currentSessionId) {
        startNewChat();
    } else {
        loadHistorySidebar(); 
    }
}

// --- D. Initial Load ---
loadHistorySidebar();

// --- E. Sidebar Toggle ---
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('hidden'); 
    if (sidebar.classList.contains('hidden')) {
        toggleSidebarBtn.textContent = '▶ Show History';
    } else {
        toggleSidebarBtn.textContent = '☰ Hide History';
    }
});

// Home button functionality (No event listener, just a link)