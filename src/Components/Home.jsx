import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import Navigationbar from "./Navigationbar";
import mermaid from "mermaid";

// Initialize mermaid only once at the application level
mermaid.initialize({ 
  startOnLoad: false,  // Change to false to manually control rendering
  theme: 'dark',
  securityLevel: 'loose',
  // Add error handling
  logLevel: 'error',
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

  // Add a ref to track when new messages with diagrams are added
  const diagramsAddedRef = useRef(false);

  useEffect(() => {
    scrollToBottom();
    
    // Check if new diagrams were added
    if (messages.some(msg => msg.type === 'diagram')) {
      diagramsAddedRef.current = true;
      
      // Use a more flexible approach to render diagrams
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        try {
          // Use a more reliable method to render all diagrams
          document.querySelectorAll('.mermaid').forEach((element) => {
            // Only render elements that haven't been processed
            if (!element.hasAttribute('data-processed')) {
              const content = element.textContent || '';
              
              // Clear the element before rendering
              element.innerHTML = '';
              
              // Use the mermaid render method for more control
              mermaid.render(`mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, content)
                .then(({ svg }) => {
                  element.innerHTML = svg;
                  element.setAttribute('data-processed', 'true');
                })
                .catch(error => {
                  console.error("Mermaid rendering error:", error);
                  element.innerHTML = `<div class="error-message">Error rendering diagram: ${error.message}</div>`;
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
    <div className="flex flex-col w-screen min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navigationbar />

      {/* Background Effects */}
      <motion.div
        initial={{ opacity: 0.1 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.8 }}
        className="absolute top-20 left-0 w-full h-[500px] rounded-full bg-purple-600 blur-[128px] z-0"
      />
      <motion.div
        initial={{ opacity: 0.1 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.8 }}
        className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-blue-600 blur-[128px] z-0"
      />

      {/* Chat Interface with Side-by-Side Layout for Explanation and Diagrams */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/90 backdrop-blur-md mt-20 relative z-10 w-full overflow-x-hidden">
        {/* User Messages */}
        {messages.map((message, index) => {
          if (message.role === "user") {
            return (
              <div key={index} className="flex justify-end w-full">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-3xl p-4 rounded-2xl bg-purple-600 text-white"
                >
                  {message.content}
                </motion.div>
              </div>
            );
          } else {
            // System message with text or diagram
            if (message.type === "diagram") {
              return (
                <div key={index} className="flex justify-start w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-md"
                  >
                    {/* Add a key to force re-render when content changes */}
                    <div className="mermaid bg-white/5 p-4 rounded-lg text-white" key={`diagram-${index}`}>
                      {message.content}
                    </div>
                  </motion.div>
                </div>
              );
            } else {
              return (
                <div key={index} className="flex justify-start w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-3xl p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white"
                  >
                    <div className="prose prose-invert">
                      {/* Render markdown text */}
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                    </div>
                  </motion.div>
                </div>
              );
            }
          }
        })}

        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="max-w-3xl p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="border-t border-white/10 p-4 bg-black/30 backdrop-blur-md w-full fixed bottom-0 z-10">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
          <div className="flex items-start space-x-2 w-full">
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
            className="flex-1 p-4 h-15 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            disabled={isLoading}
          />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-4 h-15 w-20 flex justify-center items-center rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white disabled:opacity-50 self-start"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Simple function to convert markdown to HTML
const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Convert bold
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  html = html.replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`);
  
  // Convert headers
  html = html.replace(/^\s*###\s+(.*)/gm, '<h3>$1</h3>');
  html = html.replace(/^\s*##\s+(.*)/gm, '<h2>$1</h2>');
  html = html.replace(/^\s*#\s+(.*)/gm, '<h1>$1</h1>');
  
  // Convert paragraphs (simple)
  html = html.replace(/\n\n/g, '<br><br>');
  
  return html;
};

export default Home;