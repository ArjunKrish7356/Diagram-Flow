import { useEffect, useRef } from "react";
import mermaid from "mermaid";

const MermaidDiagram = ({ chart }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
    if (containerRef.current) {
      mermaid.contentLoaded();
    }
  }, [chart]);

  return <div className="mermaid" ref={containerRef}>{chart}</div>;
};

export default MermaidDiagram;
