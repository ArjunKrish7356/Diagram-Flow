import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import Navigationbar from "./Navigationbar";
import mermaid from "mermaid";

const Home = () => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    { role: "system", content: "👋 Welcome to GroupAssign AI! Type UML code (Class, Use Case, State, Data Flow, etc.) to generate a diagram." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    scrollToBottom();
    // Initialize mermaid with specific settings
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose'
    });
    
    // Run content loaded after messages update and DOM rendering
    setTimeout(() => {
      try {
        mermaid.contentLoaded();
      } catch (e) {
        console.error("Mermaid parsing error:", e);
      }
    }, 100);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      let isUML = false;
      let diagramTypes = ["classDiagram", "sequenceDiagram", "stateDiagram", "graph TD", "graph LR", "pie", "gantt"];
      let aiResponse = "I can only generate UML diagrams if you enter valid Mermaid.js syntax.";

      if (diagramTypes.some(type => inputValue.includes(type))) {
        // Fix common syntax issues with diagrams
        const fixedInput = inputValue
          .replace(/\\n/g, "\n")  // Replace escaped newlines with actual newlines
          .replace(/\n\s+/g, "\n    "); // Ensure consistent indentation
          
        aiResponse = fixedInput;
        isUML = true;
      }

      setMessages(prev => [...prev, { role: "system", content: aiResponse, isUML }]);
    } catch (err) {
      setError("Failed to generate diagram. Please try again.");
    } finally {
      setIsLoading(false);
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
        className="absolute top-20 left-0 w-[100vw] h-[500px] rounded-full bg-purple-600 blur-[128px] z-0"
      />
      <motion.div
        initial={{ opacity: 0.1 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.8 }}
        className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-blue-600 blur-[128px] z-0"
      />

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/90 backdrop-blur-md mt-20 relative z-10 w-full overflow-x-hidden">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`max-w-3xl p-4 rounded-2xl ${
                message.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 backdrop-blur-md text-white"
              } ${message.isUML ? "w-full" : ""}`}
            >
              {message.isUML ? (
                <div className="mermaid bg-white/5 p-4 rounded-lg">{message.content}</div>
              ) : (
                message.content
              )}
            </motion.div>
          </div>
        ))}

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

      {/* Input Field with horizontally aligned button */}
      <div className="border-t border-white/10 p-4 bg-black/30 backdrop-blur-md w-full fixed  bottom-0 z-10 h-21">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
          <div className="flex items-start space-x-2 w-full">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Mermaid.js UML code..."
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
                <Send className="w-5 h-5  " />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;