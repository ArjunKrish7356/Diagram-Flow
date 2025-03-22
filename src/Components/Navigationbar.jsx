import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Users,
  Settings,
  BarChart2,
  Download,
  BookOpen,
  HelpCircle,
} from "lucide-react";

const Navigationbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <nav className="fixed w-full backdrop-blur-xl bg-black/30 border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500"
            />
            <span className="text-xl font-bold text-white">Diagram-Flow</span>
          </div>

          
        </div>
      </div>
    </nav>
  );
};

export default Navigationbar;
