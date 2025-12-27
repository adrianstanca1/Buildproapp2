import React, { useState } from 'react';
import { Page } from '@/types';

const PlatformFeaturesView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.PLATFORM_FEATURES);

  const menuItems = [
    { id: 'Home', label: 'Home' },
    { id: 'NeuralNetwork', label: 'The Neural Network' },
    { id: 'PlatformFeatures', label: 'Platform Features' },
    { id: 'Connectivity', label: 'Connectivity' },
    { id: 'DeveloperPlatform', label: 'Developer Platform' },
    { id: 'GetStarted', label: 'Get Started' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                      
                      const targetPage = pageMap[item.id] || Page.PLATFORM_FEATURES;
                      setPage(targetPage);
                      setCurrentPage(targetPage);
                    }}
                    className={`${currentPage === (item.id === 'Home' ? Page.CORTEX_BUILD_HOME :
                                  item.id === 'NeuralNetwork' ? Page.NEURAL_NETWORK :
                                  item.id === 'PlatformFeatures' ? Page.PLATFORM_FEATURES :
                                  item.id === 'Connectivity' ? Page.CONNECTIVITY :
                                  item.id === 'DeveloperPlatform' ? Page.DEVELOPER_PLATFORM :
                                  Page.PLATFORM_FEATURES)
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

      {/* Features Introduction */}
      <div className="features-intro py-16 px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 text-gray-800">A COMPREHENSIVE TOOLSET FOR MODERN CONSTRUCTION</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          CortexBuild integrates every facet of your business. Explore our core features below to understand how our platform can transform your operations.
        </p>
      </div>

      {/* Feature Stats */}
      <div className="feature-stats py-12 px-4 bg-white">
        <div className="stats-container max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="stat bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-blue-600 mb-2">100+</h3>
              <p className="text-gray-700 font-medium">Total Features</p>
            </div>
            <div className="stat bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-green-600 mb-2">85+</h3>
              <p className="text-gray-700 font-medium">Active</p>
            </div>
            <div className="stat bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-yellow-600 mb-2">10+</h3>
              <p className="text-gray-700 font-medium">In Progress</p>
            </div>
            <div className="stat bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-purple-600 mb-2">5+</h3>
              <p className="text-gray-700 font-medium">Planned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-grid py-16 px-4">
        <div className="features-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center">
              <span className="emoji text-4xl mb-4 block">🌐</span>
              <h3 className="text-xl font-bold mb-2 text-gray-800">ALL FEATURES</h3>
              <p className="text-gray-600 mb-4">Complete Platform</p>
              <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-4 rounded-lg transition duration-300">
                View all 100+ platform features
              </button>
            </div>
            
            <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center">
              <span className="emoji text-4xl mb-4 block">🏗️</span>
              <h3 className="text-xl font-bold mb-2 text-gray-800">PROJECT OPS</h3>
              <p className="text-gray-600 mb-4">Construction Management</p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Daily logs</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>RFIs</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>punch lists</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>drawings</span>
                </li>
              </ul>
            </div>
            
            <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center">
              <span className="emoji text-4xl mb-4 block">💰</span>
              <h3 className="text-xl font-bold mb-2 text-gray-800">FINANCIAL MGT</h3>
              <p className="text-gray-600 mb-4">Accounting & Finance</p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Invoicing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>budgets</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>payments</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>financial reports</span>
                </li>
              </ul>
            </div>
            
            <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center">
              <span className="emoji text-4xl mb-4 block">📈</span>
              <h3 className="text-xl font-bold mb-2 text-gray-800">BUSINESS DEV</h3>
              <p className="text-gray-600 mb-4">Growth & Strategy</p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Lead management</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>proposals</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>business analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="additional-features py-16 px-4 bg-gray-50">
        <div className="features-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="construction-tools bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-blue-800">CONSTRUCTION TOOLS</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Project Management</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Scheduling & Planning</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Resource Allocation</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Quality Control</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Safety Management</span>
                </li>
              </ul>
            </div>
            
            <div className="business-intelligence bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-green-800">BUSINESS INTELLIGENCE</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Financial Analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Performance Metrics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Market Insights</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Competitive Analysis</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Strategic Planning</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformFeaturesView;