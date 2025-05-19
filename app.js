const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

// Global variable to store the Universal Sentence Encoder model
let useModel = null;

// Load Universal Sentence Encoder model when the page loads
async function loadModel() {
    try {
        content.textContent = "Loading AI capabilities...";
        // Load the Universal Sentence Encoder model
        useModel = await use.load();
        content.textContent = "AI capabilities ready!";
        console.log("Universal Sentence Encoder model loaded successfully");
    } catch (error) {
        console.error("Error loading USE model:", error);
        content.textContent = "Failed to load some AI capabilities. Basic functions still available.";
    }
}

// Call loadModel when the page loads
window.addEventListener('load', async () => {
    speak("Initializing CENTGPT...");
    wishMe();
    
    // Load the language model in the background
    loadModel();
});

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

// Function to check if message is explicitly asking to use Google
function isExplicitGoogleRequest(message) {
    return message.includes('use google to') || 
           message.includes('search google for') || 
           message.includes('google search for') ||
           message.includes('look up on google');
}

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
        return 0;
    }
    
    return dotProduct / (normA * normB);
}

// Function to encode text using the Universal Sentence Encoder
async function encodeText(text) {
    if (!useModel) {
        console.warn("Universal Sentence Encoder model not loaded");
        return null;
    }
    
    try {
        const embeddings = await useModel.embed([text]);
        const embeddingArray = await embeddings.array();
        return embeddingArray[0]; // Return the embedding for the first (and only) input
    } catch (error) {
        console.error("Error encoding text:", error);
        return null;
    }
}

// Function to find the most similar text in the embedding data using vector similarity
async function findMostSimilarEmbedding(query) {
    // If the model isn't loaded, we can't do embedding-based search
    if (!useModel) {
        console.warn("Model not loaded, using fallback search method");
        return null;
    }
    
    try {
        // Encode the query
        const queryEmbedding = await encodeText(query);
        
        if (!queryEmbedding) {
            return null;
        }
        
        let bestMatch = null;
        let highestSimilarity = -1;
        
        // Find the most similar embedding in our data
        for (const item of embeddingData) {
            const similarity = cosineSimilarity(queryEmbedding, item.embedding);
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = item;
            }
        }
        
        // Only return a match if it's above a certain threshold
        if (highestSimilarity > 0.75) {
            return {
                text: bestMatch.text,
                response: bestMatch.response,
                similarity: highestSimilarity
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error finding similar embedding:", error);
        return null;
    }
}

// Function to find semantic matches in the question-answer pairs
function findSemanticMatch(query) {
    query = query.toLowerCase();
    
    // Try direct keyword matching first
    for (const pair of questionAnswerPairs) {
        const questionLower = pair.question.toLowerCase();
        
        // Check for significant word overlap
        const queryWords = query.split(/\s+/).filter(word => word.length > 3);
        const questionWords = questionLower.split(/\s+/).filter(word => word.length > 3);
        
        let matchCount = 0;
        for (const word of queryWords) {
            if (questionWords.includes(word)) {
                matchCount++;
            }
        }
        
        // If 50% or more of significant words match, consider it a semantic match
        if (matchCount >= Math.max(1, Math.floor(queryWords.length * 0.5))) {
            return pair.answer;
        }
        
        // Also check for direct phrase containment
        if (questionLower.includes(query) || query.includes(questionLower)) {
            return pair.answer;
        }
    }
    
    // Check if query is asking for definition or explanation of a concept
    const isDefinitionQuery = query.includes("what is") || 
                              query.includes("define") || 
                              query.includes("meaning of") ||
                              query.includes("explain");
    
    if (isDefinitionQuery) {
        // Extract the concept being asked about
        let concept = query.replace(/what is|define|meaning of|explain/gi, "").trim();
        
        // Search through questionAnswerPairs for the concept
        for (const pair of questionAnswerPairs) {
            if (pair.question.toLowerCase().includes(concept)) {
                return pair.answer;
            }
        }
    }
    
    return null;
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
        
        // Limit to a reasonable length but ensure we don't cut sentences in half
        let summary = "";
        const sentences = extract.split('. ');
        
        // Take at least 3 sentences, but ensure we don't exceed a reasonable length
        for (let i = 0; i < Math.min(5, sentences.length); i++) {
            if (summary.length + sentences[i].length <= 500) {
                summary += sentences[i] + '. ';
            } else {
                break;
            }
        }
        
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

// Multiple CORS proxy options for redundancy
const corsProxies = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://proxy.cors.sh/${url}`,
    (url) => `https://cors-anywhere.herokuapp.com/${url}`
];

// Function to try multiple proxies until one works
async function fetchWithCorsProxy(url) {
    let lastError = null;
    
    // Try each proxy in order
    for (const proxyFn of corsProxies) {
        try {
            const proxyUrl = proxyFn(url);
            const response = await fetch(proxyUrl, { timeout: 5000 });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            lastError = error;
            console.warn(`Proxy failed: ${error.message}. Trying next proxy...`);
            continue; // Try the next proxy
        }
    }
    
    // If we get here, all proxies failed
    throw new Error(lastError || "All CORS proxies failed");
}

// Function to search for general information using multiple sources with enhanced CORS handling
async function searchGeneralInfo(query) {
    try {
        // First try with multiple CORS proxy options
        const cleanQuery = query.replace(/what is|who is|where is|tell me about|information on/gi, '').trim();
        
        // Try to use the DuckDuckGo API first
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&t=CENTGPT`;
        
        try {
            const data = await fetchWithCorsProxy(ddgUrl);
            
            if (data && data.AbstractText) {
                return {
                    source: 'DuckDuckGo',
                    title: data.Heading || cleanQuery,
                    summary: data.AbstractText,
                    url: data.AbstractURL
                };
            }
        } catch (error) {
            console.error("All DuckDuckGo proxies failed:", error);
            // Continue to backup method
        }
        
        // Backup method: Wikipedia API for related topics if direct search fails
        const wikiRelatedUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=5&format=json&origin=*&srsearch=${encodeURIComponent(cleanQuery)}`;
        const relatedResponse = await fetch(wikiRelatedUrl);
        const relatedData = await relatedResponse.json();
        
        if (relatedData.query.search.length > 0) {
            // Get snippets from top 3 related results
            const relatedInfo = relatedData.query.search.slice(0, 3).map(item => {
                // Remove HTML tags from snippet
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.snippet;
                return {
                    title: item.title,
                    snippet: tempDiv.textContent || tempDiv.innerText || ""
                };
            });
            
            // Compile a summary from related information
            const summary = `Here's what I found about ${cleanQuery}: ${relatedInfo.map(info => `${info.title}: ${info.snippet}`).join('. ')}`;
            
            return {
                source: 'Wikipedia Related Topics',
                title: `Information about ${cleanQuery}`,
                summary: summary,
                url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQuery)}`
            };
        }
        
        // If all else fails, use a fallback source - Wikipedia's "Special:Search" results page
        return {
            source: 'Search Results',
            title: `Information about ${cleanQuery}`,
            summary: `I don't have specific information about "${cleanQuery}" in my knowledge base. I can show you search results from reliable sources that might help.`,
            url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQuery)}`
        };
        
    } catch (error) {
        console.error("Error with general search:", error);
        return {
            source: 'Error',
            title: `Search Error`,
            summary: `I encountered a problem searching for "${query}". This might be due to network connectivity issues or CORS restrictions. Would you like me to try another source?`,
            isError: true
        };
    }
}

// Function to search news API for current events
async function searchNews(query) {
    try {
        const newsQuery = query.replace(/news about|latest on|updates on|what's happening with/gi, '').trim();
        
        // To use this properly, you need to sign up for a free API key at https://gnews.io/
        // Replace YOUR_API_KEY with your actual GNews API key
        const apiKey = "YOUR_API_KEY"; // You'll need to replace this with a real key
        
        // Check if we have an API key
        if (apiKey === "YOUR_API_KEY") {
            // Return a fallback response if no API key is set
            return {
                source: 'News Sources',
                title: `Latest on ${newsQuery}`,
                summary: `To get real news updates about ${newsQuery}, I need to be configured with a valid news API key. For now, I'll provide some general information.`,
                isSimulated: true
            };
        }
        
        const newsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(newsQuery)}&token=${apiKey}&lang=en&max=3`;
        
        // Make the API request
        const response = await fetch(newsUrl);
        
        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`News API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we have articles
        if (!data.articles || data.articles.length === 0) {
            return {
                source: 'News Sources',
                title: `No news found for ${newsQuery}`,
                summary: `I couldn't find any recent news about ${newsQuery}. Would you like me to search for something else?`,
                articles: []
            };
        }
        
        // Format the news response
        const articles = data.articles.slice(0, 3).map(article => ({
            title: article.title,
            source: article.source.name,
            url: article.url,
            publishedAt: new Date(article.publishedAt).toLocaleString()
        }));
        
        // Create a summary from the articles
        const summary = `Here are the latest headlines about ${newsQuery}: 
            1. ${articles[0].title} (${articles[0].source})
            ${articles.length > 1 ? `2. ${articles[1].title} (${articles[1].source})` : ''}
            ${articles.length > 2 ? `3. ${articles[2].title} (${articles[2].source})` : ''}
            Would you like me to open any of these articles?`;
        
        return {
            source: 'GNews API',
            title: `Latest on ${newsQuery}`,
            summary: summary,
            articles: articles
        };
    } catch (error) {
        console.error("Error searching news:", error);
        
        // Provide a fallback response in case of API errors
        return {
            source: 'News Sources',
            title: `Latest on ${newsQuery}`,
            summary: `I encountered an error while searching for news about ${newsQuery}. This could be due to API limits or connection issues. Here's what I know generally: 
                ${newsQuery} has been in the news recently with various developments. Would you like me to try searching on Google News instead?`,
            error: error.message,
            isSimulated: true
        };
    }
}

// Enhanced function to generate a context-aware knowledge graph response
function generateKnowledgeGraphResponse(query) {
    // Clean the query and extract main terms
    const cleanQuery = query.replace(/what is|who is|where is|when is|why is|how does|can you tell me about/gi, '').trim();
    const queryWords = cleanQuery.toLowerCase().split(/\s+/);
    
    // Identify matching knowledge domains
    let bestDomain = null;
    let bestMatchScore = 0;
    let matchedKeywords = [];
    
    // Find the domain with the most keyword matches
    for (const [domain, data] of Object.entries(knowledgeDomains)) {
        const domainKeywords = data.keywords;
        const matches = queryWords.filter(word => domainKeywords.includes(word));
        
        if (matches.length > bestMatchScore) {
            bestMatchScore = matches.length;
            bestDomain = domain;
            matchedKeywords = matches;
        }
    }
    
    // If no good domain match, use a general response
    if (bestMatchScore === 0 || bestDomain === null) {
        // Look for named entities (capitalized words) in the query
        const possibleEntities = cleanQuery.split(/\s+/).filter(word => 
            word.length > 1 && word[0] === word[0].toUpperCase()
        );
        
        let generalResponse = '';
        
        if (possibleEntities.length > 0) {
            const entities = possibleEntities.join(', ');
            generalResponse = `Based on my knowledge graph, ${cleanQuery} appears to be associated with ${entities}. This subject involves multiple concepts and perspectives. The most accurate information would come from specialized sources on this topic.`;
        } else {
            // Extract potentially important terms (words longer than 4 characters)
            const significantTerms = queryWords.filter(word => word.length > 4);
            
            if (significantTerms.length > 0) {
                generalResponse = `My knowledge graph shows that ${cleanQuery} relates to concepts like ${significantTerms.join(', ')}. This is a multifaceted topic with various aspects to consider. For comprehensive information, consulting authoritative sources would be ideal.`;
            } else {
                generalResponse = `${cleanQuery} encompasses several interrelated concepts according to my knowledge graph. This topic has various dimensions worth exploring. For detailed information, I recommend consulting specialized resources on this subject.`;
            }
        }
        
        return {
            source: 'Knowledge Graph',
            title: cleanQuery,
            summary: generalResponse
        };
    }
    
    // Generate a response based on the best matching domain
    const domainData = knowledgeDomains[bestDomain];
    
    // Pick 2-3 random facts from the domain
    const shuffledFacts = [...domainData.facts].sort(() => 0.5 - Math.random());
    const selectedFacts = shuffledFacts.slice(0, Math.min(3, shuffledFacts.length));
    
    // Highlight the matched keywords in the response
    const highlightedKeywords = matchedKeywords.length > 0 
        ? matchedKeywords.join(', ') 
        : `aspects of ${bestDomain}`;
    
    // Construct the response
    const response = `According to my knowledge graph, ${cleanQuery} is related to ${highlightedKeywords} in the field of ${bestDomain}. This topic ${selectedFacts.join('. Also, it ')}. For more comprehensive information, specialized resources would provide deeper insights.`;
    
    return {
        source: 'Knowledge Graph',
        title: `Information about ${cleanQuery}`,
        summary: response,
        relatedConcepts: highlightedKeywords,
        domain: bestDomain
    };
}

// Enhanced function to detect the query intent for better response selection
function detectQueryIntent(query) {
    const lowerQuery = query.toLowerCase();

    // Define patterns for different intent types
    const intentPatterns = [
        {
            intent: 'how-to',
            patterns: ['how to', 'how do i', 'how can i', 'steps to', 'guide for', 'tutorial', 'instructions', 'teach me']
        },
        {
            intent: 'definition',
            patterns: ['what is', 'what are', 'define', 'meaning of', 'definition of', 'explain', 'tell me about', 'describe']
        },
        {
            intent: 'history',
            patterns: ['history of', 'origin of', 'when did', 'when was', 'how did', 'development of', 'evolution of', 'background of']
        },
        {
            intent: 'comparison',
            patterns: ['difference between', 'compare', 'versus', 'vs', 'similarities', 'differences', 'which is better', 'contrast']
        },
        {
            intent: 'recommendation',
            patterns: ['best', 'top', 'recommended', 'most popular', 'suggest', 'advice', 'should i', 'recommend', 'worth']
        },
        {
            intent: 'news',
            patterns: ['news', 'latest', 'recent', 'update', 'what happened', 'current events', 'today']
        },
        {
            intent: 'location',
            patterns: ['where is', 'location of', 'find', 'nearby', 'closest', 'directions to', 'how to get to']
        },
        {
            intent: 'time',
            patterns: ['when is', 'time of', 'schedule', 'duration', 'how long', 'opening hours', 'deadline']
        },
        {
            intent: 'reason',
            patterns: ['why is', 'why do', 'reason for', 'cause of', 'explain why', 'how come']
        },
        {
            intent: 'personal',
            patterns: ['i am', 'my', 'i feel', 'i need', 'help me', 'i want', 'for me', 'i would like']
        }
    ];

    // Check for patterns in the query
    for (const intentType of intentPatterns) {
        for (const pattern of intentType.patterns) {
            if (lowerQuery.includes(pattern)) {
                return intentType.intent;
            }
        }
    }
    
    return 'general-information';
}

// Function to get answers from multiple sources - now enhanced with local semantic search
async function getMultiSourceAnswer(query) {
    content.textContent = "Searching for information...";
    
    // Detect the query intent for customizing responses
    const queryIntent = detectQueryIntent(query);
    
    // First, try to find a direct answer in the knowledge base
    const directAnswer = knowledgeBase[query] || 
                         Object.keys(knowledgeBase).find(key => query.includes(key) && knowledgeBase[key]);
    
    if (directAnswer) {
        const answer = typeof directAnswer === 'string' ? directAnswer : knowledgeBase[directAnswer];
        content.textContent = answer;
        speak(answer);
        return;
    }
    
    // Second, try semantic matching from our curated question-answer pairs
    const semanticMatch = findSemanticMatch(query);
    
    if (semanticMatch) {
        content.textContent = semanticMatch;
        speak(semanticMatch);
        return;
    }
    
    // Third, try vector embedding search for semantic similarity if the model is loaded
    if (useModel) {
        try {
            const embeddingMatch = await findMostSimilarEmbedding(query);
            
            if (embeddingMatch) {
                content.textContent = embeddingMatch.response;
                speak(embeddingMatch.response);
                return;
            }
        } catch (error) {
            console.error("Error in embedding search:", error);
            // Continue with other search methods if embedding search fails
        }
    }
    
    // Fourth, try Wikipedia for more comprehensive information
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
        // If it's an error response, handle differently
        if (generalResult.isError) {
            content.textContent = generalResult.summary;
            speak(generalResult.summary);
            
            setTimeout(() => {
                speak("Would you like me to try a direct Google search instead? Say yes or no.");
                window.pendingSearch = {
                    query: query,
                    type: 'google'
                };
            }, 1000 * (generalResult.summary.split(' ').length / 3));
            
            return;
        }
        
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
    if (queryIntent === 'news') {
        const newsResult = await searchNews(query);
        
        if (newsResult) {
            let displayText = `${newsResult.summary} (Source: ${newsResult.source})`;
            
            // If this is a simulated result, show a note about it
            if (newsResult.isSimulated) {
                displayText += "\n\nNote: Using simulated news data. To get real-time news, a valid API key is needed.";
            }
            
            content.textContent = displayText;
            
            // Only speak the main summary, not the technical note
            speak(newsResult.summary);
            
            // If we have real articles, set up a pending search for article selection
            if (newsResult.articles && newsResult.articles.length > 0 && !newsResult.isSimulated) {
                setTimeout(() => {
                    speak("Would you like me to open one of these articles? Say the number of the article you'd like to view, or say no.");
                    window.pendingSearch = {
                        query: newsResult.title,
                        type: 'news-selection',
                        articles: newsResult.articles
                    };
                }, 1000 * (newsResult.summary.split(' ').length / 2.5));
            }
            
            return;
        }
    }
    
    // If we still don't have an answer, use our enhanced knowledge graph response
    const knowledgeGraphResult = generateKnowledgeGraphResponse(query);
    
    // Customize the response based on query intent
    let responseIntro = '';
    
    switch (queryIntent) {
        case 'definition':
            responseIntro = `Here's what my knowledge graph shows about the meaning of ${query.replace(/what is|what are|define|meaning of/gi, '').trim()}: `;
            break;
        case 'how-to':
            responseIntro = `Regarding how to ${query.replace(/how to|steps to|guide for/gi, '').trim()}, my knowledge graph indicates: `;
            break;
        case 'history':
            responseIntro = `On the history of ${query.replace(/history of|origin of|when did|when was/gi, '').trim()}, my knowledge graph shows: `;
            break;
        case 'comparison':
            responseIntro = `Comparing ${query.replace(/difference between|compare|versus|vs/gi, '').trim()}, based on my knowledge graph: `;
            break;
        case 'recommendation':
            responseIntro = `Regarding ${query.replace(/best|top|recommended|most popular/gi, '').trim()}, my knowledge graph suggests: `;
            break;
        case 'reason':
            responseIntro = `Regarding why ${query.replace(/why is|why do|reason for|cause of/gi, '').trim()}, my knowledge base indicates: `;
            break;
        case 'location':
            responseIntro = `About the location of ${query.replace(/where is|location of|find/gi, '').trim()}, my knowledge graph shows: `;
            break;
        case 'time':
            responseIntro = `Regarding the timing of ${query.replace(/when is|time of|schedule/gi, '').trim()}, according to my knowledge: `;
            break;
        case 'personal':
            responseIntro = `Based on what you've shared about ${query.replace(/i am|my|i feel|i need/gi, '').trim()}, I can suggest: `;
            break;
        default:
            responseIntro = '';
    }
    
    const finalResponse = responseIntro + knowledgeGraphResult.summary;
    content.textContent = finalResponse;
    speak(finalResponse);
    
    setTimeout(() => {
        speak("Would you like me to search Google for more detailed information? Say yes or no.");
        window.pendingSearch = {
            query: query,
            type: 'google'
        };
    }, 1000 * (finalResponse.split(' ').length / 3));
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
        } 
        // Handle numeric responses for news article selection
        else if (window.pendingSearch.type === 'news-selection' && window.pendingSearch.articles) {
            const articleNum = parseInt(message.match(/\d+/)?.[0]);
            
            if (!isNaN(articleNum) && articleNum > 0 && articleNum <= window.pendingSearch.articles.length) {
                const article = window.pendingSearch.articles[articleNum - 1];
                window.open(article.url, "_blank");
                speak(`Opening the article "${article.title}" from ${article.source}`);
            } else {
                speak("Okay, is there anything else you'd like to know?");
            }
        }
        else {
            speak("Okay, is there anything else you'd like to know?");
        }
        
        // Clear the pending search
        window.pendingSearch = null;
        return;
    }
    
    // Try to find a direct answer first
    const directAnswer = knowledgeBase[message] || 
                         Object.keys(knowledgeBase).find(key => message.includes(key) && knowledgeBase[key]);
    
    if (directAnswer) {
        speak(typeof directAnswer === 'string' ? directAnswer : knowledgeBase[directAnswer]);
        content.textContent = typeof directAnswer === 'string' ? directAnswer : knowledgeBase[directAnswer];
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