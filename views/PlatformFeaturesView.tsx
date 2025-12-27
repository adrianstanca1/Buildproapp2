import React from 'react';

const PlatformFeaturesView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Features Intro */}
        <div className="features-intro text-center py-16">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">A COMPREHENSIVE TOOLSET FOR MODERN CONSTRUCTION</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            CortexBuild integrates every facet of your business. Explore our core features below to understand how our platform can transform your operations.
          </p>
        </div>

        {/* Feature Metrics */}
        <div className="feature-metrics py-12">
          <div className="metrics-container max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="metric bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-3xl font-bold text-blue-600 mb-2">100+</h3>
                <p className="text-gray-600">Total Features</p>
              </div>
              <div className="metric bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-3xl font-bold text-green-600 mb-2">85+</h3>
                <p className="text-gray-600">Active</p>
              </div>
              <div className="metric bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-3xl font-bold text-yellow-600 mb-2">10+</h3>
                <p className="text-gray-600">In Progress</p>
              </div>
              <div className="metric bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-3xl font-bold text-purple-600 mb-2">5+</h3>
                <p className="text-gray-600">Planned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid py-12">
          <div className="features-container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
                <span className="emoji text-4xl mb-4 block">🌐</span>
                <h3 className="text-xl font-bold mb-2 text-gray-800">ALL FEATURES</h3>
                <p className="text-gray-600 mb-4">Complete Platform</p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                  View all 100+ platform features
                </button>
              </div>
              
              <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
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
              
              <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
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
              
              <div className="feature-category bg-white p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
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

        {/* Additional Features Section */}
        <div className="additional-features py-12">
          <div className="features-container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="feature-card bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-blue-800">CONSTRUCTION TOOLS</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Project Management</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Scheduling & Planning</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Resource Allocation</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Quality Control</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Safety Management</span>
                  </li>
                </ul>
              </div>
              
              <div className="feature-card bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-green-800">BUSINESS INTELLIGENCE</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Financial Analytics</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Performance Metrics</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Market Insights</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Competitive Analysis</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Strategic Planning</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformFeaturesView;
