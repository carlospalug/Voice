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
    "tell me a joke": "Why don't scientists trust atoms? Because they make up everything!",
    "another joke": "Why did the JavaScript developer wear glasses? Because he couldn't C#!",
    "thank you": "You're welcome! Is there anything else I can help you with?",
    "goodbye": "Goodbye! Have a great day. Call me again if you need assistance.",
    "bye": "Goodbye! Have a great day. Call me again if you need assistance."
};

// Function to check if message is explicitly asking to use Google
function isExplicitGoogleRequest(message) {
    return message.includes('use google to') || 
           message.includes('search google for') || 
           message.includes('google search for') ||
           message.includes('look up on google');
}

// Function to perform a Wikipedia search and get a summary
async function searchWikipedia(query) {
    content.textContent = "Searching for information...";
    
    try {
        // Format the query for the API
        const searchTerm = query.replace(/what is|who is|where is|tell me about|information on/gi, '').trim();
        
        // First, search for the term to get the page title
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(searchTerm)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        // If no search results found
        if (!searchData.query.search.length) {
            speak("I couldn't find information about that. Would you like me to search Google instead?");
            window.pendingSearch = {
                query: searchTerm,
                type: 'google'
            };
            return;
        }
        
        // Get the page title from search results
        const pageTitle = searchData.query.search[0].title;
        
        // Get the page extract (summary)
        const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&format=json&origin=*&titles=${encodeURIComponent(pageTitle)}`;
        const summaryResponse = await fetch(summaryUrl);
        const summaryData = await summaryResponse.json();
        
        // Extract the page ID and content
        const pageId = Object.keys(summaryData.query.pages)[0];
        let extract = summaryData.query.pages[pageId].extract;
        
        // Clean up the HTML to plain text and get a concise version
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = extract;
        extract = tempDiv.textContent || tempDiv.innerText || "";
        
        // Limit to a reasonable length for speech
        const summary = extract.split('. ').slice(0, 3).join('. ') + '.';
        
        // Display and speak the summary
        content.textContent = summary;
        speak(summary);
        
        // Ask if user wants more detailed information
        setTimeout(() => {
            speak("Would you like me to open the full Wikipedia page for more information? Say yes or no.");
            window.pendingSearch = {
                query: pageTitle,
                type: 'wikipedia-page'
            };
        }, 1000 * (summary.split(' ').length / 3)); // Wait for speech to finish
        
    } catch (error) {
        console.error("Error searching Wikipedia:", error);
        speak("I'm having trouble searching for that information. Would you like me to try Google instead?");
        window.pendingSearch = {
            query,
            type: 'google'
        };
    }
}

// Function to perform a general web search in real-time
async function performWebSearch(query) {
    // First try Wikipedia as it has a free API
    await searchWikipedia(query);
}

function takeCommand(message) {
    // Check if this is a response to a pending search question
    if (window.pendingSearch) {
        if (message.includes('yes')) {
            const query = window.pendingSearch.query;
            const type = window.pendingSearch.type;
            
            if (type === 'google') {
                window.open(`https://www.google.com/search?q=${query.replace(/\s+/g, "+")}`, "_blank");
                speak(`Opening Google search for ${query}`);
            } else if (type === 'wikipedia-page') {
                window.open(`https://en.wikipedia.org/wiki/${query.replace(/\s+/g, "_")}`, "_blank");
                speak(`Opening the Wikipedia page for ${query}`);
            }
        } else {
            speak("Okay, is there anything else you'd like to know?");
        }
        
        // Clear the pending search
        window.pendingSearch = null;
        return;
    }
    
    // Try to find a direct answer first
    const directAnswer = knowledgeBase[message] || Object.keys(knowledgeBase).find(key => message.includes(key) && knowledgeBase[key]);
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
    // Explicit request to use Google
    else if (isExplicitGoogleRequest(message)) {
        const searchQuery = message.replace(/use google to|search google for|google search for|look up on google/gi, '').trim();
        window.open(`https://www.google.com/search?q=${searchQuery.replace(/\s+/g, "+")}`, "_blank");
        speak(`Opening Google search for ${searchQuery}`);
    }
    // For any other query, perform real-time search
    else {
        performWebSearch(message);
    }
}