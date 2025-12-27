import React, { useState } from 'react';
import { Page } from '@/types';

const NeuralNetworkView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.NEURAL_NETWORK);

  const menuItems = [
    { id: 'Home', label: 'Home' },
    { id: 'NeuralNetwork', label: 'The Neural Network' },
    { id: 'PlatformFeatures', label: 'Platform Features' },
    { id: 'Connectivity', label: 'Connectivity' },
    { id: 'DeveloperPlatform', label: 'Developer Platform' },
    { id: 'GetStarted', label: 'Get Started' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CortexBuild
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const pageMap: Record<string, Page> = {
                        'Home': Page.CORTEX_BUILD_HOME,
                        'NeuralNetwork': Page.NEURAL_NETWORK,
                        'PlatformFeatures': Page.PLATFORM_FEATURES,
                        'Connectivity': Page.CONNECTIVITY,
                        'DeveloperPlatform': Page.DEVELOPER_PLATFORM,
                        'GetStarted': Page.PUBLIC_LOGIN
                      };
                      
                      const targetPage = pageMap[item.id] || Page.NEURAL_NETWORK;
                      setPage(targetPage);
                      setCurrentPage(targetPage);
                    }}
                    className={`${currentPage === (item.id === 'Home' ? Page.CORTEX_BUILD_HOME :
                                  item.id === 'NeuralNetwork' ? Page.NEURAL_NETWORK :
                                  item.id === 'PlatformFeatures' ? Page.PLATFORM_FEATURES :
                                  item.id === 'Connectivity' ? Page.CONNECTIVITY :
                                  item.id === 'DeveloperPlatform' ? Page.DEVELOPER_PLATFORM :
                                  Page.NEURAL_NETWORK)
                      ? "text-blue-600 font-bold border-b-2 border-blue-600 pb-1"
                      : "text-gray-700 hover:text-blue-600"
                    } capitalize transition-colors duration-200`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* AI Core Section */}
      <div className="ai-core-section py-16 px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 text-gray-800">THE AI CORE: YOUR DIGITAL TEAM OF EXPERTS</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Powered by advanced AI models, our intelligent agents work 24/7 to optimize your construction business.
        </p>
      </div>

      {/* Agents Grid */}
      <div className="agents-grid py-12 px-4">
        <div className="agents-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="agent-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <span className="emoji text-4xl mb-4 block text-center">🏗️</span>
              <h3 className="text-xl font-bold mb-2 text-blue-600 text-center">PROJECT INTELLIGENCE</h3>
              <p className="text-gray-600 mb-4 text-center">AI Project Manager</p>
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
              <span className="emoji text-4xl mb-4 block text-center">💰</span>
              <h3 className="text-xl font-bold mb-2 text-green-600 text-center">FINANCIAL ADVISOR</h3>
              <p className="text-gray-600 mb-4 text-center">AI Accountant</p>
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
              <span className="emoji text-4xl mb-4 block text-center">📄</span>
              <h3 className="text-xl font-bold mb-2 text-purple-600 text-center">DOCUMENT INTELLIGENCE</h3>
              <p className="text-gray-600 mb-4 text-center">AI Document Analyst</p>
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
              <span className="emoji text-4xl mb-4 block text-center">🦺</span>
              <h3 className="text-xl font-bold mb-2 text-orange-600 text-center">SAFETY MONITOR</h3>
              <p className="text-gray-600 mb-4 text-center">AI Safety Officer</p>
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
              <span className="emoji text-4xl mb-4 block text-center">📊</span>
              <h3 className="text-xl font-bold mb-2 text-teal-600 text-center">BUSINESS STRATEGIST</h3>
              <p className="text-gray-600 mb-4 text-center">AI Business Advisor</p>
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
              <span className="emoji text-4xl mb-4 block text-center">🤖</span>
              <h3 className="text-xl font-bold mb-2 text-indigo-600 text-center">CONVERSATIONAL ASSISTANT</h3>
              <p className="text-gray-600 mb-4 text-center">AI Chat Interface</p>
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
      <div className="collaboration-section py-16 px-4">
        <div className="collaboration-container max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-12 text-gray-800">HOW OUR AI AGENTS COLLABORATE</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="collaboration-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block">🔄</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">REAL-TIME SYNC</h4>
              <p className="text-gray-600">
                All agents share a unified knowledge base, ensuring consistent and coordinated actions across all business functions.
              </p>
            </div>
            <div className="collaboration-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block">⚡</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">INSTANT INSIGHTS</h4>
              <p className="text-gray-600">
                Get answers in seconds, not hours. Our AI agents process complex queries and deliver actionable insights instantly.
              </p>
            </div>
            <div className="collaboration-feature bg-white p-6 rounded-xl shadow-md">
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
  );
};

export default NeuralNetworkView;