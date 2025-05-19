const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);

    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;

    window.speechSynthesis.speak(text_speak);
}

function wishMe() {
    var day = new Date();
    var hour = day.getHours();

    if (hour >= 0 && hour < 12) {
        speak("Good Morning Boss...");
    } else if (hour >= 12 && hour < 17) {
        speak("Good Afternoon Master...");
    } else {
        speak("Good Evening Sir...");
    }
}

window.addEventListener('load', () => {
    speak("Initializing CENTGPT...");
    wishMe();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener('click', () => {
    content.textContent = "Listening...";
    recognition.start();
});

// Simple knowledge base for direct answers
const knowledgeBase = {
    "who are you": "I am CENTGPT, your virtual assistant. I can answer questions, provide information, and help you navigate the web.",
    "what can you do": "I can answer basic questions, tell you the time and date, open websites, search for information, and have simple conversations.",
    "how are you": "I'm functioning well, thank you for asking. How can I assist you today?",
    "what is ai": "Artificial Intelligence or AI refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect.",
    "what is machine learning": "Machine Learning is a subset of AI that enables systems to learn from data, identify patterns, and make decisions with minimal human intervention.",
    "who created you": "I was created as a virtual assistant project called CENTGPT.",
    "what is the weather": "I don't have real-time weather data. Would you like me to search for current weather information online?",
    "tell me a joke": "Why don't scientists trust atoms? Because they make up everything!",
    "another joke": "Why did the JavaScript developer wear glasses? Because he couldn't C#!",
    "thank you": "You're welcome! Is there anything else I can help you with?",
    "goodbye": "Goodbye! Have a great day. Call me again if you need assistance.",
    "bye": "Goodbye! Have a great day. Call me again if you need assistance."
};

// Function to check if the message is asking about a person, place, or thing
function isInfoQuery(message) {
    return message.includes('who is') || 
           message.includes('what is') || 
           message.includes('where is') || 
           message.includes('tell me about') ||
           message.includes('information on');
}

// Function to ask user if they want to search online
function askToSearch(message, searchType = 'google') {
    content.textContent = `Would you like me to search ${searchType} for "${message}"? Say "yes" or "no".`;
    speak(`Would you like me to search ${searchType} for this information? Say yes or no.`);
    
    // Set a flag to handle the next recognition as a yes/no response
    window.pendingSearch = {
        query: message,
        type: searchType
    };
}

// Helper function to find direct answers from the knowledge base
function getDirectAnswer(message) {
    // First try exact match
    if (knowledgeBase[message]) {
        return knowledgeBase[message];
    }
    
    // Then try to find partial matches
    for (const key in knowledgeBase) {
        if (message.includes(key)) {
            return knowledgeBase[key];
        }
    }
    
    return null;
}

function takeCommand(message) {
    // Check if this is a response to a pending search question
    if (window.pendingSearch) {
        if (message.includes('yes')) {
            const query = window.pendingSearch.query;
            const type = window.pendingSearch.type;
            
            if (type === 'google') {
                window.open(`https://www.google.com/search?q=${query.replace(" ", "+")}`, "_blank");
                speak(`Searching Google for ${query}`);
            } else if (type === 'wikipedia') {
                window.open(`https://en.wikipedia.org/wiki/${query.replace("wikipedia", "").trim()}`, "_blank");
                speak(`Looking up ${query} on Wikipedia`);
            }
        } else {
            speak("Okay, I won't search online. Is there anything else you'd like to know?");
        }
        
        // Clear the pending search
        window.pendingSearch = null;
        return;
    }
    
    // Try to find a direct answer first
    const directAnswer = getDirectAnswer(message);
    if (directAnswer) {
        speak(directAnswer);
        return;
    }
    
    // Basic commands and responses
    if (message.includes('hey') || message.includes('hello')) {
        speak("Hello Sir, How May I Help You?");
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Opening Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Opening Youtube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Opening Facebook...");
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "The current time is " + time;
        speak(finalText);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
        const finalText = "Today's date is " + date;
        speak(finalText);
    } else if (message.includes('calculator')) {
        window.open('Calculator:///');
        const finalText = "Opening Calculator";
        speak(finalText);
    } 
    // Handle the wikipedia specific search
    else if (message.includes('wikipedia')) {
        askToSearch(message, 'wikipedia');
    }
    // For general knowledge queries that might need web search
    else if (isInfoQuery(message)) {
        askToSearch(message);
    } 
    // For any other unhandled query, suggest a web search
    else {
        speak(`I don't have a direct answer for that. Would you like me to search online?`);
        askToSearch(message);
    }
}