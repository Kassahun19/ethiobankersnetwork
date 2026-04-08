import React, { useState } from "react";
import api from "../services/api";
import { motion } from "motion/react";
import { FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";

const CVAnalyzer: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await api.post("/user/analyze-cv");
      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze CV. Please make sure you've uploaded a CV first.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 bg-gradient-to-br from-blue-800 to-blue-900 text-white relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24" />
        </div>
        <h3 className="text-2xl font-bold mb-2 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-yellow-400" /> AI CV Analyzer
        </h3>
        <p className="text-blue-100 text-sm">
          Get instant feedback on your CV and see how it matches the Ethiopian banking market.
        </p>
      </div>

      <div className="p-8">
        {!result ? (
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-blue-800" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Ready to optimize?</h4>
            <p className="text-gray-500 text-sm mb-8">Our AI will score your CV and provide 3 key suggestions to help you stand out.</p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-100 text-left">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition-all shadow-md flex items-center justify-center disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Analyze My CV"}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="text-center bg-blue-50 p-6 rounded-3xl border border-blue-100 flex-grow mr-4">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">CV Score</p>
                <h4 className="text-4xl font-black text-blue-800">{result.score}/100</h4>
              </div>
              <button 
                onClick={() => setResult(null)}
                className="text-gray-400 hover:text-blue-800 transition-colors"
              >
                Re-analyze
              </button>
            </div>

            <h5 className="font-bold text-gray-900 flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" /> Key Suggestions
            </h5>
            <ul className="space-y-4">
              {result.suggestions.map((suggestion: string, i: number) => (
                <li key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 flex items-start">
                  <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mr-3 flex-shrink-0 shadow-sm">
                    {i + 1}
                  </span>
                  {suggestion}
                </li>
              ))}
            </ul>

            <button className="w-full mt-4 flex items-center justify-center text-blue-800 font-bold hover:underline">
              View Full Report <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CVAnalyzer;
