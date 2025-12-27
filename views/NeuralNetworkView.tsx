import React from 'react';

const NeuralNetworkView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4">
        {/* AI Core Section */}
        <div className="ai-core-section text-center py-16">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">THE AI CORE: YOUR DIGITAL TEAM OF EXPERTS</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powered by advanced AI models, our intelligent agents work 24/7 to optimize your construction business.
          </p>
        </div>

        {/* Agents Grid */}
        <div className="agents-grid py-12">
          <div className="agents-container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">🏗️</span>
                <h3 className="text-xl font-bold mb-2 text-blue-600">PROJECT INTELLIGENCE</h3>
                <p className="text-gray-600 mb-4">AI Project Manager</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Schedule Optimization</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Risk Detection</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Resource Planning</span>
                  </li>
                </ul>
              </div>
              
              <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">💰</span>
                <h3 className="text-xl font-bold mb-2 text-green-600">FINANCIAL ADVISOR</h3>
                <p className="text-gray-600 mb-4">AI Accountant</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Cash Flow Analysis</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Budget Forecasting</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Cost Optimization</span>
                  </li>
                </ul>
              </div>
              
              <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">📄</span>
                <h3 className="text-xl font-bold mb-2 text-purple-600">DOCUMENT INTELLIGENCE</h3>
                <p className="text-gray-600 mb-4">AI Document Analyst</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Smart Search</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Data Extraction</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Auto-Tagging</span>
                  </li>
                </ul>
              </div>
              
              <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">🦺</span>
                <h3 className="text-xl font-bold mb-2 text-orange-600">SAFETY MONITOR</h3>
                <p className="text-gray-600 mb-4">AI Safety Officer</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Hazard Detection</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Compliance Checks</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Incident Prevention</span>
                  </li>
                </ul>
              </div>
              
              <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">📊</span>
                <h3 className="text-xl font-bold mb-2 text-teal-600">BUSINESS STRATEGIST</h3>
                <p className="text-gray-600 mb-4">AI Business Advisor</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Market Analysis</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Lead Scoring</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Growth Strategy</span>
                  </li>
                </ul>
              </div>
              
              <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">🤖</span>
                <h3 className="text-xl font-bold mb-2 text-indigo-600">CONVERSATIONAL ASSISTANT</h3>
                <p className="text-gray-600 mb-4">AI Chat Interface</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Natural Language</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Voice Commands</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>24/7 Support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Collaboration Section */}
        <div className="collaboration-section py-16">
          <div className="collaboration-container max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-12 text-gray-800">HOW OUR AI AGENTS COLLABORATE</h3>
            <div className="collaboration-features grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="feature bg-white p-6 rounded-xl shadow-md">
                <span className="emoji text-3xl mb-4 block">🔄</span>
                <h4 className="text-xl font-bold mb-2 text-gray-800">REAL-TIME SYNC</h4>
                <p className="text-gray-600">
                  All agents share a unified knowledge base, ensuring consistent and coordinated actions across all business functions.
                </p>
              </div>
              <div className="feature bg-white p-6 rounded-xl shadow-md">
                <span className="emoji text-3xl mb-4 block">⚡</span>
                <h4 className="text-xl font-bold mb-2 text-gray-800">INSTANT INSIGHTS</h4>
                <p className="text-gray-600">
                  Get answers in seconds, not hours. Our AI agents process complex queries and deliver actionable insights instantly.
                </p>
              </div>
              <div className="feature bg-white p-6 rounded-xl shadow-md">
                <span className="emoji text-3xl mb-4 block">🎯</span>
                <h4 className="text-xl font-bold mb-2 text-gray-800">PROACTIVE ALERTS</h4>
                <p className="text-gray-600">
                  Don't wait for problems to arise. Our agents predict issues and send alerts before they impact your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralNetworkView;
