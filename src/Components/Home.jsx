import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import Navigationbar from "./Navigationbar";
import mermaid from "mermaid";

const Home = () => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    { role: "system", content: "👋 Welcome to DiagramFlow! Enter a GitHub repository URL to start analyzing, or ask questions about your code architecture.", type: "text" },
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

    const userMessage = { role: "user", content: inputValue, type: "text" };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      // In a real implementation, you would call your API here
      // For demo purposes, we're using the sample response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sample response similar to your second paste
      const sampleResponse = {"Response":"The provided codebase implements a system for converting code into a graph representation, storing it in a ChromaDB, and querying it with a local LLM for question-answering. Here's a breakdown of the architecture:\n\n**1. Code Conversion and Storage:**\n\n*   **`codeToGraphConverter.py`:** This module is the core of the code-to-graph conversion process.\n    *   `CodeConverter` class: This class uses the `ast` module to parse Python code into an Abstract Syntax Tree (AST). It then traverses the AST using the `NodeVisitor` class.\n        *   `__init__`: Initializes an empty list `chunks` to store code snippets.\n        *   `visit_FunctionDef`:  This method is triggered when a function definition (`FunctionDef` node) is encountered in the AST. It extracts the function's code using `ast.unparse()` and appends it to the `chunks` list.\n        *   `visit_ClassDef`: This method works similarly to `visit_FunctionDef`, but for class definitions (`ClassDef` nodes).\n        *   `convert`: This method takes a file path as input, reads the file content, parses it into an AST, creates a `CodeConverter` instance, visits the AST to extract code chunks, and returns the `chunks` list.  Essentially, this extracts functions and classes to a list of strings(code).\n*   **`PushToDB.py`:** This module handles storing the extracted code snippets into a ChromaDB database. It likely takes the output of `codeToGraphConverter` (a list of code chunks) and persists them in the database.\n*   **`GetFromDB.py`:** This module facilitates retrieving code snippets from the ChromaDB based on a query. This likely involves searching the database using a query and retrieving matching code relevant to the prompt.\n\n**2. Question Answering with LLM:**\n\n*   **`main.py`:** This module is the entry point of the system.\n    *   `runLLM`: This function presumably takes a query as input, uses `Fetch_from_DB` (from `GetFromDB.py`) to retrieve relevant code (context) from the ChromaDB, and then passes the question and context to a local LLM (likely using an API like OpenAI with a local model). It gets the answer from the LLM.\n\n**3. Supporting Modules (example file):**\n\n*   **`FilesToConvert/sample.py`:** This directory/file contains example Python code (in this case web scraping logic). From the overview, there are also other files in the `FilesToConvert` folder.  The purpose is that these can be converted, stored, and recalled by the LLM.\n\n**Overall Architecture:**\n\nThe system follows a pipeline:\n\n1.  **Code Extraction:** Python code files are processed by `codeToGraphConverter.py` to identify and extract function and class definitions.\n2.  **Data Storage:** Extracted code snippets are stored in ChromaDB (using `PushToDB.py`).\n3.  **Query Processing:**\n    *   A query/question is passed to `runLLM` in `main.py`.\n    *   `Fetch_from_DB` in `GetFromDB.py` retrieves relevant code snippets from ChromaDB based on the query.\n4.  **LLM Interaction:** The question and retrieved code chunks are fed to a local LLM. The LLM generates an answer.\n\n**Diagrams:**\n\n1.  **System Architecture Diagram:**\n\n    This diagram shows the components and their interactions:\n\n    ```mermaid.js\n    graph LR\n        A[User] --> B(main.py: runLLM)\n        B --> C(GetFromDB: Fetch_from_DB)\n        C --> D{ChromaDB}\n        D -.-> C\n        C --> B\n        B --> E{Local LLM}\n        E -.-> B\n        B --> F[Answer]\n        B --> G{Files to convert}\n        G --> H(codeToGraphConverter.py: convert)\n        H --> D\n        H --> I(PushToDB: Push_to_DB)\n        style D fill:#f9f,stroke:#333,stroke-width:2px\n        style E fill:#ccf,stroke:#333,stroke-width:2px\n    ```\n\n2.  **Sequence Diagram (Conceptual):**\n\n    This diagram outlines the sequence of actions when answering a question:\n\n    ```mermaid.js\n    sequenceDiagram\n        participant User\n        participant Main\n        participant GetFromDB\n        participant ChromaDB\n        participant LLM\n\n        User->>Main: Ask Question\n        Main->>GetFromDB: Fetch Relevant Code (Query)\n        GetFromDB->>ChromaDB: Search for Code Snippets\n        ChromaDB-->>GetFromDB: Matching Code Snippets\n        GetFromDB->>Main: Return Code Snippets\n        Main->>LLM: Question + Code Snippets\n        LLM-->>Main: Answer\n        Main->>User: Display Answer\n    ```\n"};
      
      // Parse the LLM response to separate text and diagrams
      const parsedContent = parseLLMResponse(sampleResponse.Response || inputValue);
      
      // Add each content part as a separate message
      parsedContent.forEach(item => {
        setMessages(prev => [...prev, { role: "system", content: item.content, type: item.type }]);
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process response. Please try again.");
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
                    <div className="mermaid bg-white/5 p-4 rounded-lg text-white">{message.content}</div>
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
              placeholder="Enter GitHub repository URL or ask a question about your code..."
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