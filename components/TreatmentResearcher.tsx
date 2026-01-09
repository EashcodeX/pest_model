import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { researchTreatments } from '../services/geminiService';

const TreatmentResearcher: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ text: string | undefined, sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await researchTreatments(query);
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ text: "Failed to fetch research data. Please try again.", sources: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Search size={20} className="text-blue-600" />
        Research Treatments
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Describe pest or symptom</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Organic control for whitefly in tomatoes"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto border border-gray-200">
        {!result && !loading && (
          <div className="text-gray-400 text-center py-8 text-sm">
            Enter a query to find the latest treatment methods using Google Search grounding.
          </div>
        )}
        
        {result && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {result.text}
            </div>
            
            {result.sources.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sources</h4>
                <ul className="space-y-1">
                  {result.sources.map((source: any, idx: number) => (
                    <li key={idx}>
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-xs truncate"
                      >
                        <ExternalLink size={10} />
                        {source.title || source.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3 flex gap-2 items-start">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-amber-800">
          <strong>Disclaimer:</strong> AI-generated suggestions. Always consult with a certified agronomist before applying chemicals.
        </p>
      </div>
    </div>
  );
};

export default TreatmentResearcher;