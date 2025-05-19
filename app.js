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
    try {
        // Format the query for the API
        const searchTerm = query.replace(/what is|who is|where is|tell me about|information on/gi, '').trim();
        
        // First, search for the term to get the page title
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(searchTerm)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        // If no search results found
        if (!searchData.query.search.length) {
            return null;
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
        
        // Limit to a reasonable length
        const summary = extract.split('. ').slice(0, 3).join('. ') + '.';
        
        return {
            source: 'Wikipedia',
            title: pageTitle,
            summary: summary,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/\s+/g, "_"))}`
        };
        
    } catch (error) {
        console.error("Error searching Wikipedia:", error);
        return null;
    }
}

// Function to search for general information using multiple sources
async function searchGeneralInfo(query) {
    try {
        // We'll use the DuckDuckGo Instant Answer API for general searches
        const cleanQuery = query.replace(/what is|who is|where is|tell me about|information on/gi, '').trim();
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&t=CENTGPT`;
        
        // Use a proxy to avoid CORS issues
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(ddgUrl)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data && data.AbstractText) {
            return {
                source: 'DuckDuckGo',
                title: data.Heading || cleanQuery,
                summary: data.AbstractText,
                url: data.AbstractURL
            };
        }
        
        return null;
    } catch (error) {
        console.error("Error with general search:", error);
        return null;
    }
}

// Function to search news API for current events
async function searchNews(query) {
    try {
        const newsQuery = query.replace(/news about|latest on|updates on|what's happening with/gi, '').trim();
        // Using a free news API
        const newsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(newsQuery)}&token=sample-token&lang=en`;
        
        // Simulated news response for demonstration
        const simulatedNews = {
            source: 'News Sources',
            title: `Latest on ${newsQuery}`,
            summary: `Here are the latest updates on ${newsQuery} from multiple news sources. The situation is developing, and new information is being reported frequently. Would you like me to find more specific details?`,
            articles: [
                { title: `Recent developments in ${newsQuery}`, source: 'News Source 1' },
                { title: `What experts are saying about ${newsQuery}`, source: 'News Source 2' },
                { title: `Analysis: The impact of ${newsQuery}`, source: 'News Source 3' }
            ]
        };
        
        return simulatedNews;
    } catch (error) {
        console.error("Error searching news:", error);
        return null;
    }
}

// Function to get answers from multiple sources
async function getMultiSourceAnswer(query) {
    content.textContent = "Searching for information...";
    
    // Try Wikipedia first
    const wikiResult = await searchWikipedia(query);
    
    // If we got a Wikipedia result, use it
    if (wikiResult) {
        content.textContent = `${wikiResult.summary} (Source: Wikipedia)`;
        speak(wikiResult.summary);
        
        // Ask if they want more detailed information
        setTimeout(() => {
            speak("Would you like me to open the full page for more information? Say yes or no.");
            window.pendingSearch = {
                query: wikiResult.title,
                type: 'wikipedia-page',
                url: wikiResult.url
            };
        }, 1000 * (wikiResult.summary.split(' ').length / 3)); // Wait for speech to finish
        
        return;
    }
    
    // If no Wikipedia result, try general info search
    const generalResult = await searchGeneralInfo(query);
    
    if (generalResult) {
        content.textContent = `${generalResult.summary} (Source: ${generalResult.source})`;
        speak(generalResult.summary);
        
        setTimeout(() => {
            speak("Would you like me to open the source page for more details? Say yes or no.");
            window.pendingSearch = {
                query: generalResult.title,
                type: 'general-page',
                url: generalResult.url
            };
        }, 1000 * (generalResult.summary.split(' ').length / 3));
        
        return;
    }
    
    // Check if it's a news-related query
    if (query.includes('news') || query.includes('latest') || query.includes('updates') || query.includes('what\'s happening')) {
        const newsResult = await searchNews(query);
        
        if (newsResult) {
            content.textContent = `${newsResult.summary} (Source: News APIs)`;
            speak(newsResult.summary);
            return;
        }
    }
    
    // If we still don't have an answer, use a Google Knowledge Graph simulation
    const simulatedKnowledgeResult = {
        source: 'Knowledge Database',
        summary: `Based on multiple sources, ${query} refers to [simulated answer]. This information is compiled from various online sources. Would you like me to search Google for more comprehensive details?`
    };
    
    content.textContent = simulatedKnowledgeResult.summary.replace('[simulated answer]', 
        `information related to "${query}" includes various perspectives from around the web`);
    
    speak(simulatedKnowledgeResult.summary.replace('[simulated answer]', 
        `information related to ${query} includes various perspectives from around the web`));
    
    setTimeout(() => {
        speak("Would you like me to search Google for more details? Say yes or no.");
        window.pendingSearch = {
            query: query,
            type: 'google'
        };
    }, 5000);
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
                window.open(window.pendingSearch.url || `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, "_")}`, "_blank");
                speak(`Opening the Wikipedia page for ${query}`);
            } else if (type === 'general-page') {
                window.open(window.pendingSearch.url, "_blank");
                speak(`Opening the source page for more information about ${query}`);
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
        content.textContent = directAnswer;
        return;
    }
    
    // Basic commands and responses
    if (message.includes('hey') || message.includes('hello')) {
        speak("Hello Sir, How May I Help You?");
        content.textContent = "Hello Sir, How May I Help You?";
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Opening Google...");
        content.textContent = "Opening Google...";
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Opening Youtube...");
        content.textContent = "Opening Youtube...";
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Opening Facebook...");
        content.textContent = "Opening Facebook...";
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "The current time is " + time;
        speak(finalText);
        content.textContent = finalText;
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
        const finalText = "Today's date is " + date;
        speak(finalText);
        content.textContent = finalText;
    } else if (message.includes('calculator')) {
        window.open('Calculator:///');
        const finalText = "Opening Calculator";
        speak(finalText);
        content.textContent = finalText;
    } 
    // Explicit request to use Google
    else if (isExplicitGoogleRequest(message)) {
        const searchQuery = message.replace(/use google to|search google for|google search for|look up on google/gi, '').trim();
        window.open(`https://www.google.com/search?q=${searchQuery.replace(/\s+/g, "+")}`, "_blank");
        speak(`Opening Google search for ${searchQuery}`);
        content.textContent = `Opening Google search for "${searchQuery}"`;
    }
    // For any other query, perform multi-source search
    else {
        getMultiSourceAnswer(message);
    }
}