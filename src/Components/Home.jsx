import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, Send, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import Navigationbar from "./Navigationbar";
import mermaid from "mermaid";

// Initialize mermaid with improved settings and error handling
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  logLevel: 'error',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  curve: 'linear'
});

const Home = () => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    { role: "system", content: "👋 Welcome to DiagramFlow! Enter a GitHub repository URL to start analyzing, or ask questions about your code architecture.", type: "text" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [repoCloned, setRepoCloned] = useState(false);
  const diagramsAddedRef = useRef(false);

  useEffect(() => {
    scrollToBottom();
    
    if (messages.some(msg => msg.type === 'diagram')) {
      diagramsAddedRef.current = true;
      
      requestAnimationFrame(() => {
        try {
          document.querySelectorAll('.mermaid').forEach((element) => {
            if (!element.hasAttribute('data-processed')) {
              const content = element.textContent || '';
              element.innerHTML = '';
              
              mermaid.render(`mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, content)
                .then(({ svg }) => {
                  element.innerHTML = svg;
                  element.setAttribute('data-processed', 'true');
                })
                .catch(error => {
                  console.error("Mermaid rendering error:", error);
                  element.innerHTML = `<div class="error-message p-3 rounded bg-red-800/40 text-red-200 text-sm">Error rendering diagram: ${error.message}</div>`;
                });
            }
          });
        } catch (e) {
          console.error("Mermaid processing error:", e);
        }
      });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to parse the LLM response and extract mermaid diagrams
  const parseLLMResponse = (response) => {
    // Check if response is in JSON format
    let parsedResponse;
    try {
      if (typeof response === 'string' && response.trim().startsWith('{')) {
        parsedResponse = JSON.parse(response);
        response = parsedResponse.Response || response;
      }
    } catch (err) {
      console.error("Error parsing JSON response:", err);
    }

    const result = [];
    
    // Regular expression to match mermaid blocks
    const mermaidRegex = /```mermaid\.js\s*([\s\S]*?)```/g;
    
    let lastIndex = 0;
    let match;
    
    // Find all mermaid diagram blocks
    while ((match = mermaidRegex.exec(response)) !== null) {
      // Add text content before the mermaid block
      if (match.index > lastIndex) {
        const textContent = response.substring(lastIndex, match.index).trim();
        if (textContent) {
          result.push({ type: 'text', content: textContent });
        }
      }
      
      // Add the mermaid diagram, replacing escaped newlines
      const diagramContent = match[1].replace(/\\n/g, '\n').trim();
      result.push({ type: 'diagram', content: diagramContent });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last mermaid block
    if (lastIndex < response.length) {
      const textContent = response.substring(lastIndex).trim();
      if (textContent) {
        result.push({ type: 'text', content: textContent });
      }
    }
    
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
  
    setIsLoading(true);
    setError("");
  
    if (!repoCloned) {
      // Step 1: Clone the repository first
      try {
        const response = await fetch("http://localhost:8000/clonerepo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: inputValue })
        });
  
        const data = await response.json();
  
        if (data.status === "Ok") {
          setRepoCloned(true);
          setMessages(prev => [
            ...prev,
            { role: "system", content: "✅ Repository cloned successfully! Now you can ask questions about the code.", type: "text" }
          ]);
        } else {
          throw new Error("Failed to clone the repository. Please enter a valid GitHub URL.");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to clone repository. Please try again.");
        return;
      } finally {
        setIsLoading(false);
        setInputValue(""); // Clear the input field
      }
    } else {
      // Step 2: Generate response after cloning
      try {
        const userMessage = { role: "user", content: inputValue, type: "text" };
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
  
        const response = await fetch("http://localhost:8000/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ question: inputValue })
        });
  
        if (!response.ok) {
          throw new Error("Failed to get a response from the backend.");
        }
  
        const data = await response.json();
        const parsedContent = parseLLMResponse(data.Response || inputValue);
  
        parsedContent.forEach(item => {
          setMessages(prev => [...prev, { role: "system", content: item.content, type: item.type }]);
        });
  
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to process response. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };



  return (
    <div className="flex flex-col w-screen min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
      <Navigationbar />

      {/* More subtle background effects */}
      <motion.div
        initial={{ opacity: 0.05 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.2 }}
        className="absolute top-20 left-0 w-full h-[500px] rounded-full bg-purple-700 blur-[160px] z-0"
      />
      <motion.div
        initial={{ opacity: 0.05 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.2 }}
        className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-blue-700 blur-[160px] z-0"
      />

      {/* Improved message container with better spacing */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-950/95 backdrop-blur-md mt-20 relative z-10 w-full overflow-x-hidden mb-24">
        <AnimatePresence>
          {messages.map((message, index) => {
            if (message.role === "user") {
              return (
                <motion.div 
                  key={index} 
                  className="flex justify-end w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-2xl p-4 rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
                    {message.content}
                  </div>
                </motion.div>
              );
            } else {
              if (message.type === "diagram") {
                return (
                  <motion.div 
                    key={index} 
                    className="flex justify-start w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="w-full max-w-3xl p-5 rounded-2xl bg-gray-800/40 backdrop-blur-md border border-gray-700/50 shadow-xl">
                      <div className="mermaid bg-gray-900/60 p-5 rounded-lg text-white overflow-x-auto" key={`diagram-${index}`}>
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                );
              } else {
                return (
                  <motion.div 
                    key={index} 
                    className="flex justify-start w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="max-w-3xl p-4 rounded-2xl rounded-tl-sm bg-gray-800/40 backdrop-blur-md border border-gray-700/50 text-white shadow-lg">
                      <div className="prose prose-invert prose-headings:text-blue-300 prose-a:text-purple-300 prose-strong:text-white/90 prose-code:text-amber-300 prose-pre:bg-gray-900/70 prose-pre:border prose-pre:border-gray-700/50 prose-pre:rounded-md max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                      </div>
                    </div>
                  </motion.div>
                );
              }
            }
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            className="flex justify-start w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-3xl p-4 rounded-2xl bg-gray-800/30 backdrop-blur-md text-white border border-gray-700/30">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-sm text-gray-300">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-xl border border-red-900/50 bg-red-950/50 backdrop-blur-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Improved input field */}
      <div className="border-t border-gray-800/70 p-4 bg-gray-900/80 backdrop-blur-md w-full fixed bottom-0 z-10 shadow-lg">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
          <div className="flex items-start space-x-3 w-full">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={repoCloned ? "Ask a question about the code..." : "Enter GitHub repository URL..."}
              className="flex-1 p-4 h-15 rounded-xl bg-gray-800/70 border border-gray-700/70 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent resize-none shadow-inner"
              disabled={isLoading}
            />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-4 h-15 w-16 flex justify-center items-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed self-start shadow-lg shadow-purple-700/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          
          {/* Message hint */}
          <div className="text-xs text-gray-500 text-center mt-2">
            Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400 text-xs mx-1">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400 text-xs mx-1">Shift+Enter</kbd> for new line
          </div>
        </form>
      </div>
      
      {/* Scroll indicator */}
      {messages.length > 2 && (
        <motion.button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 p-2 rounded-full bg-gray-800/70 backdrop-blur-md border border-gray-700/50 text-white z-20 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

// Improved markdown renderer with better styling
const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Convert code blocks
  let html = text.replace(/```(\w*)([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="language-${lang || 'text'}"><code>${code.trim()}</code></pre>`;
  });
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  html = html.replace(/^\s*-\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>');
  
  // Wrap lists
  let inList = false;
  const lines = html.split('\n');
  html = lines.map(line => {
    if (line.includes('<li>')) {
      if (!inList) {
        inList = true;
        return '<ul>' + line;
      }
      return line;
    } else if (inList) {
      inList = false;
      return '</ul>' + line;
    }
    return line;
  }).join('\n');
  
  if (inList) {
    html += '</ul>';
  }
  
  // Convert headers
  html = html.replace(/^\s*###\s+(.*)/gm, '<h3>$1</h3>');
  html = html.replace(/^\s*##\s+(.*)/gm, '<h2>$1</h2>');
  html = html.replace(/^\s*#\s+(.*)/gm, '<h1>$1</h1>');
  
  // Convert paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.trim()) return '';
    if (para.includes('<h1>') || para.includes('<h2>') || para.includes('<h3>') || 
        para.includes('<ul>') || para.includes('<pre>')) {
      return para;
    }
    return `<p>${para}</p>`;
  }).join('');
  
  // Convert line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
};

export default Home;