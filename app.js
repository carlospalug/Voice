const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
const recordingIndicator = document.querySelector('.recording-indicator');

// Define knowledgeBase globally to ensure it's available throughout the file
const knowledgeBase = {
    "who are you": "I am CENTGPT, your virtual assistant. I can answer questions, provide information, and help you navigate the web.",
    "what can you do": "I can answer basic questions, tell you the time and date, open websites, search for information, get weather updates, and have simple conversations.",
    "how are you": "I'm functioning well, thank you for asking. How can I assist you today?",
    "what is ai": "Artificial Intelligence or AI refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect.",
    "what is machine learning": "Machine Learning is a subset of AI that enables systems to learn from data, identify patterns, and make decisions with minimal human intervention.",
    "who created you": "I was created as a virtual assistant project called CENTGPT.",
    "tell me a joke": "Why don't scientists trust atoms? Because they make up everything!",
    "another joke": "Why did the JavaScript developer wear glasses? Because he couldn't C#!",
    "thank you": "You're welcome! Is there anything else I can help you with?",
    "goodbye": "Goodbye! Have a great day. Call me again if you need assistance.",
    "bye": "Goodbye! Have a great day. Call me again if you need assistance.",
    "hello": "Hello! How can I help you today?",
    "hi": "Hi there! What can I do for you?",
    "good morning": "Good morning! How can I assist you today?",
    "good afternoon": "Good afternoon! What can I help you with?",
    "good evening": "Good evening! How may I be of service?",
    "what's your favorite color": "As an AI, I don't have personal preferences, but I find blue quite calming in user interfaces.",
    "what's the meaning of life": "The meaning of life is a philosophical question that has many answers depending on one's beliefs. Some say it's 42!",
    "tell me about yourself": "I'm CENTGPT, a voice-activated assistant designed to help with information retrieval, answer questions, and assist with basic tasks. I'm always learning and improving!",
    "who is your creator": "I was created as a CENTGPT project, a voice assistant designed to help users with various tasks and information.",
    "what time is it": "I can tell you the current time if you ask me about the time.",
    "what is the weather": "I can check the current weather for you if you specify a location. Try asking 'what's the weather in New York?'"
};

// Command history system
const commandHistory = {
    commands: [],
    maxLength: 10,
    
    add(command) {
        this.commands.unshift(command); // Add to beginning
        if (this.commands.length > this.maxLength) {
            this.commands.pop(); // Remove oldest command
        }
        // Update the UI
        this.updateUI();
    },
    
    updateUI() {
        const historyContainer = document.querySelector('.command-history');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            this.commands.forEach(cmd => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.textContent = cmd;
                item.addEventListener('click', () => {
                    content.textContent = cmd;
                    takeCommand(cmd.toLowerCase());
                });
                historyContainer.appendChild(item);
            });
        }
    }
};

function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);

    // Get voice settings from preferences
    const preferences = getVoicePreferences();
    text_speak.rate = preferences.rate;
    text_speak.volume = preferences.volume;
    text_speak.pitch = preferences.pitch;
    
    // Try to use preferred voice if set
    if (preferences.voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.name === preferences.voiceName);
        if (preferredVoice) {
            text_speak.voice = preferredVoice;
        }
    }

    window.speechSynthesis.speak(text_speak);
    
    // Visual feedback that the assistant is speaking
    document.querySelector('.image img').classList.add('speaking');
    
    text_speak.onend = () => {
        document.querySelector('.image img').classList.remove('speaking');
    };
}

// Get or set voice preferences
function getVoicePreferences() {
    const defaultPreferences = {
        rate: 1,
        volume: 1,
        pitch: 1,
        voiceName: null
    };
    
    const savedPrefs = localStorage.getItem('voicePreferences');
    return savedPrefs ? JSON.parse(savedPrefs) : defaultPreferences;
}

function saveVoicePreferences(preferences) {
    localStorage.setItem('voicePreferences', JSON.stringify(preferences));
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
    
    // Initialize command history UI
    if (!document.querySelector('.command-history')) {
        const historyContainer = document.createElement('div');
        historyContainer.className = 'command-history';
        historyContainer.innerHTML = '<h3>Command History</h3>';
        document.querySelector('.main').appendChild(historyContainer);
    }
    
    // Populate voice selection if it exists
    populateVoiceOptions();
    
    // Initialize recording indicator
    if (!recordingIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'recording-indicator';
        document.querySelector('.input').appendChild(indicator);
    }

    // Initialize embedded browser controls
    initBrowser();
});

// Populate voice dropdown with available voices
function populateVoiceOptions() {
    const voiceSelect = document.getElementById('voice-select');
    if (voiceSelect) {
        window.speechSynthesis.getVoices().forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        // Set current preference if any
        const prefs = getVoicePreferences();
        if (prefs.voiceName) {
            voiceSelect.value = prefs.voiceName;
        }
    }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    commandHistory.add(transcript); // Add to history
    takeCommand(transcript.toLowerCase());
};

recognition.onstart = () => {
    if (recordingIndicator) {
        recordingIndicator.classList.add('active');
    }
};

recognition.onend = () => {
    if (recordingIndicator) {
        recordingIndicator.classList.remove('active');
    }
};

btn.addEventListener('click', () => {
    content.textContent = "Listening...";
    recognition.start();
});

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

// Weather API function
async function getWeather(location) {
    try {
        // Using OpenWeatherMap API (you would need an API key)
        // For demo purposes, we'll simulate a response
        const weatherData = {
            location: location,
            temperature: Math.floor(Math.random() * 30) + 5, // Random temp between 5-35°C
            condition: ['sunny', 'cloudy', 'rainy', 'partly cloudy', 'stormy'][Math.floor(Math.random() * 5)],
            humidity: Math.floor(Math.random() * 60) + 30 // Random humidity between 30-90%
        };
        
        const weatherResponse = `The weather in ${weatherData.location} is currently ${weatherData.condition} with a temperature of ${weatherData.temperature}°C and ${weatherData.humidity}% humidity.`;
        
        return {
            source: 'Weather Service',
            summary: weatherResponse,
            data: weatherData
        };
    } catch (error) {
        console.error("Error fetching weather:", error);
        return null;
    }
}

// Function to get answers from multiple sources
async function getMultiSourceAnswer(query) {
    content.textContent = "Searching for information...";
    
    // Check if it's a weather query
    if (query.includes('weather in') || query.includes('temperature in')) {
        const locationMatch = query.match(/(?:weather|temperature) in (.+)/i);
        if (locationMatch && locationMatch[1]) {
            const location = locationMatch[1].trim();
            const weatherInfo = await getWeather(location);
            
            if (weatherInfo) {
                content.textContent = weatherInfo.summary;
                speak(weatherInfo.summary);
                return;
            }
        }
    }
    
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

// Initialize the embedded browser
function initBrowser() {
    const browser = document.getElementById('embedded-browser');
    const backBtn = document.getElementById('browser-back');
    const forwardBtn = document.getElementById('browser-forward');
    const refreshBtn = document.getElementById('browser-refresh');
    const urlInput = document.getElementById('browser-url');
    const goBtn = document.getElementById('browser-go');
    const closeBtn = document.getElementById('browser-close');
    const frame = document.getElementById('browser-frame');

    // Back button
    backBtn.addEventListener('click', () => {
        try {
            frame.contentWindow.history.back();
        } catch (error) {
            console.error("Navigation error:", error);
        }
    });

    // Forward button
    forwardBtn.addEventListener('click', () => {
        try {
            frame.contentWindow.history.forward();
        } catch (error) {
            console.error("Navigation error:", error);
        }
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        try {
            frame.src = frame.src;
        } catch (error) {
            console.error("Refresh error:", error);
        }
    });

    // Go button
    goBtn.addEventListener('click', () => {
        navigateToUrl(urlInput.value);
    });

    // Enter key in URL input
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigateToUrl(urlInput.value);
        }
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        closeBrowser();
    });

    // Update URL on iframe load
    frame.addEventListener('load', () => {
        try {
            let currentUrl = frame.contentWindow.location.href;
            if (currentUrl !== 'about:blank') {
                urlInput.value = currentUrl;
            }
        } catch (error) {
            console.error("Error accessing iframe URL:", error);
        }
    });
}

// Function to navigate to a URL in the embedded browser
function navigateToUrl(url) {
    if (!url) return;
    
    const frame = document.getElementById('browser-frame');
    const urlInput = document.getElementById('browser-url');
    
    // Add http:// if protocol is missing
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    
    try {
        frame.src = url;
        urlInput.value = url;
    } catch (error) {
        console.error("Navigation error:", error);
        speak("Sorry, I couldn't load that website. Please try another URL.");
    }
}

// Function to open the embedded browser
function openBrowser(url) {
    const browser = document.getElementById('embedded-browser');
    browser.classList.add('active');
    
    if (url) {
        navigateToUrl(url);
    }
    
    speak("Opening the browser. You can navigate using the controls at the top.");
}

// Function to close the embedded browser
function closeBrowser() {
    const browser = document.getElementById('embedded-browser');
    browser.classList.remove('active');
    // Reset the iframe to prevent audio/video from continuing to play
    document.getElementById('browser-frame').src = 'about:blank';
}

function takeCommand(message) {
    // Check if this is a response to a pending search question
    if (window.pendingSearch) {
        if (message.includes('yes')) {
            const query = window.pendingSearch.query;
            const type = window.pendingSearch.type;
            
            if (type === 'google') {
                // Use embedded browser instead of new tab
                openBrowser(`https://www.google.com/search?q=${query.replace(/\s+/g, "+")}`);
                speak(`Opening Google search for ${query} in the embedded browser`);
            } else if (type === 'wikipedia-page') {
                openBrowser(window.pendingSearch.url || `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, "_")}`);
                speak(`Opening the Wikipedia page for ${query} in the embedded browser`);
            } else if (type === 'general-page') {
                openBrowser(window.pendingSearch.url);
                speak(`Opening the source page for more information about ${query} in the embedded browser`);
            }
        } else {
            speak("Okay, is there anything else you'd like to know?");
        }
        
        // Clear the pending search
        window.pendingSearch = null;
        return;
    }
    
    // Browser commands
    if (message.includes('open browser') || message.includes('show browser')) {
        openBrowser();
        return;
    }
    
    if (message.includes('close browser') || message.includes('hide browser')) {
        closeBrowser();
        speak("Browser closed.");
        return;
    }
    
    // Voice Settings Commands
    if (message.includes('change your voice') || message.includes('voice settings') || message.includes('change voice settings')) {
        toggleVoiceSettings();
        speak("Voice settings panel is now open. You can adjust my speaking rate, volume, and pitch.");
        return;
    }
    
    // Try to find a direct answer in the knowledge base
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
        // Use embedded browser instead of new tab
        openBrowser("https://google.com");
        speak("Opening Google in the embedded browser...");
        content.textContent = "Opening Google in the embedded browser...";
    } else if (message.includes("open youtube")) {
        openBrowser("https://youtube.com");
        speak("Opening Youtube in the embedded browser...");
        content.textContent = "Opening Youtube in the embedded browser...";
    } else if (message.includes("open facebook")) {
        openBrowser("https://facebook.com");
        speak("Opening Facebook in the embedded browser...");
        content.textContent = "Opening Facebook in the embedded browser...";
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
    } else if (message.includes('weather')) {
        // Extract location from the message
        const locationMatch = message.match(/weather (?:in|for|at) (.+)/i);
        if (locationMatch && locationMatch[1]) {
            const location = locationMatch[1].trim();
            getWeather(location).then(weatherInfo => {
                if (weatherInfo) {
                    speak(weatherInfo.summary);
                    content.textContent = weatherInfo.summary;
                }
            });
        } else {
            speak("Please specify a location for the weather. For example, 'What's the weather in New York?'");
            content.textContent = "Please specify a location for the weather.";
        }
    } else if (message.includes('clear history') || message.includes('delete history')) {
        commandHistory.commands = [];
        commandHistory.updateUI();
        speak("Command history has been cleared.");
        content.textContent = "Command history cleared.";
    } 
    // Website browsing commands
    else if (message.includes('visit') || message.includes('go to')) {
        const urlMatch = message.match(/(?:visit|go to) ([\w\.-]+\.\w+)/i);
        if (urlMatch && urlMatch[1]) {
            const url = urlMatch[1].trim();
            openBrowser(url);
            speak(`Opening ${url} in the embedded browser`);
            content.textContent = `Opening ${url} in the embedded browser`;
        } else {
            speak("Please specify a valid website to visit.");
            content.textContent = "Please specify a valid website to visit.";
        }
    }
    // Explicit request to use Google
    else if (isExplicitGoogleRequest(message)) {
        const searchQuery = message.replace(/use google to|search google for|google search for|look up on google/gi, '').trim();
        openBrowser(`https://www.google.com/search?q=${searchQuery.replace(/\s+/g, "+")}`);
        speak(`Opening Google search for ${searchQuery} in the embedded browser`);
        content.textContent = `Opening Google search for "${searchQuery}" in the embedded browser`;
    }
    // For any other query, perform multi-source search
    else {
        getMultiSourceAnswer(message);
    }
}

// Function to toggle voice settings panel
function toggleVoiceSettings() {
    let settingsPanel = document.querySelector('.voice-settings');
    
    if (!settingsPanel) {
        // Create the settings panel
        settingsPanel = document.createElement('div');
        settingsPanel.className = 'voice-settings';
        settingsPanel.innerHTML = `
            <h3>Voice Settings</h3>
            <div class="setting">
                <label for="voice-select">Voice:</label>
                <select id="voice-select"></select>
            </div>
            <div class="setting">
                <label for="rate">Speed:</label>
                <input type="range" id="rate" min="0.5" max="2" step="0.1" value="1">
                <span id="rate-value">1</span>
            </div>
            <div class="setting">
                <label for="volume">Volume:</label>
                <input type="range" id="volume" min="0" max="1" step="0.1" value="1">
                <span id="volume-value">1</span>
            </div>
            <div class="setting">
                <label for="pitch">Pitch:</label>
                <input type="range" id="pitch" min="0.5" max="2" step="0.1" value="1">
                <span id="pitch-value">1</span>
            </div>
            <button id="test-voice">Test Voice</button>
            <button id="save-voice">Save Settings</button>
            <button id="close-settings">Close</button>
        `;
        
        document.querySelector('.main').appendChild(settingsPanel);
        
        // Populate voice options
        populateVoiceOptions();
        
        // Load current settings
        const prefs = getVoicePreferences();
        document.getElementById('rate').value = prefs.rate;
        document.getElementById('volume').value = prefs.volume;
        document.getElementById('pitch').value = prefs.pitch;
        document.getElementById('rate-value').textContent = prefs.rate;
        document.getElementById('volume-value').textContent = prefs.volume;
        document.getElementById('pitch-value').textContent = prefs.pitch;
        
        // Add event listeners
        document.getElementById('rate').addEventListener('input', e => {
            document.getElementById('rate-value').textContent = e.target.value;
        });
        
        document.getElementById('volume').addEventListener('input', e => {
            document.getElementById('volume-value').textContent = e.target.value;
        });
        
        document.getElementById('pitch').addEventListener('input', e => {
            document.getElementById('pitch-value').textContent = e.target.value;
        });
        
        document.getElementById('test-voice').addEventListener('click', () => {
            const testPrefs = {
                rate: parseFloat(document.getElementById('rate').value),
                volume: parseFloat(document.getElementById('volume').value),
                pitch: parseFloat(document.getElementById('pitch').value),
                voiceName: document.getElementById('voice-select').value
            };
            
            const text_speak = new SpeechSynthesisUtterance("This is a test of the current voice settings.");
            text_speak.rate = testPrefs.rate;
            text_speak.volume = testPrefs.volume;
            text_speak.pitch = testPrefs.pitch;
            
            if (testPrefs.voiceName) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(voice => voice.name === testPrefs.voiceName);
                if (selectedVoice) {
                    text_speak.voice = selectedVoice;
                }
            }
            
            window.speechSynthesis.speak(text_speak);
        });
        
        document.getElementById('save-voice').addEventListener('click', () => {
            const newPrefs = {
                rate: parseFloat(document.getElementById('rate').value),
                volume: parseFloat(document.getElementById('volume').value),
                pitch: parseFloat(document.getElementById('pitch').value),
                voiceName: document.getElementById('voice-select').value
            };
            
            saveVoicePreferences(newPrefs);
            speak("Voice settings have been saved.");
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            toggleVoiceSettings();
        });
    } else {
        // Toggle visibility
        if (settingsPanel.style.display === 'none' || !settingsPanel.style.display) {
            settingsPanel.style.display = 'block';
        } else {
            settingsPanel.style.display = 'none';
        }
    }
}

// Continuous listening mode toggle
let continuousListening = false;

function toggleContinuousListening() {
    continuousListening = !continuousListening;
    
    if (continuousListening) {
        speak("Continuous listening mode activated. I will listen for commands without needing to click the button.");
        content.textContent = "Continuous listening mode: ON";
        
        recognition.continuous = true;
        recognition.start();
        
        // Visual indicator for continuous mode
        document.querySelector('.talk').classList.add('continuous-active');
    } else {
        speak("Continuous listening mode deactivated.");
        content.textContent = "Continuous listening mode: OFF";
        
        recognition.continuous = false;
        recognition.stop();
        
        // Remove visual indicator
        document.querySelector('.talk').classList.remove('continuous-active');
    }
}

// Add event listener for long-press to toggle continuous listening
let pressTimer;
btn.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
        toggleContinuousListening();
    }, 1500); // 1.5 seconds for long press
});

btn.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
});

// Handle when recognition service disconnects
recognition.onend = () => {
    if (continuousListening) {
        recognition.start();
    }
    
    if (recordingIndicator) {
        recordingIndicator.classList.remove('active');
    }
};