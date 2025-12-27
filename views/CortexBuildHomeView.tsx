import React, { useState } from 'react';

const CortexBuildHomeView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('Home');

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
                    onClick={() => setCurrentPage(item.id)}
                    className={`${currentPage === item.id
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

      {/* Hero Section */}
      <div className="hero-section py-20 px-4 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🚀 The Future of Construction Intelligence
        </h1>
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">BUILD SMARTER, NOT HARDER</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          AI-powered construction intelligence platform that gives SMBs the power of enterprise-level tools
        </p>
        <div className="cta-buttons flex justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
            Start Free Trial
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
            Watch Demo
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-grid py-16 px-4">
        <div className="features-container max-w-6xl mx-auto">
          <div className="feature-card flex justify-center gap-8 text-4xl mb-16">
            <span className="emoji">🧠</span>
            <span className="emoji">🏗️</span>
            <span className="emoji">💰</span>
            <span className="emoji">📊</span>
            <span className="emoji">🤖</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section py-12 px-4 bg-white">
        <div className="stats-container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="stat-item text-center">
              <h3 className="text-4xl font-bold text-blue-600">100+</h3>
              <p className="text-gray-600">AI Features</p>
            </div>
            <div className="stat-item text-center">
              <h3 className="text-4xl font-bold text-green-600">24/7</h3>
              <p className="text-gray-600">Automation</p>
            </div>
            <div className="stat-item text-center">
              <h3 className="text-4xl font-bold text-purple-600">Real-time</h3>
              <p className="text-gray-600">Insights</p>
            </div>
            <div className="stat-item text-center">
              <h3 className="text-4xl font-bold text-orange-600">Smart</h3>
              <p className="text-gray-600">Decisions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision/Mission Section */}
      <div className="vision-mission-section py-16 px-4">
        <div className="vision-mission-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="vision-card bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-blue-800">OUR VISION</h3>
              <p className="text-gray-700 text-lg">
                To revolutionize the construction industry by making enterprise-level AI technology accessible to every construction business, regardless of size, democratizing innovation and empowering the builders of tomorrow.
              </p>
            </div>
            <div className="mission-card bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-green-800">OUR MISSION</h3>
              <p className="text-gray-700 text-lg">
                To empower construction SMBs with a unified, AI-powered platform that eliminates inefficiencies, reduces costs, and increases profitability through intelligent automation, predictive analytics, and seamless integration of all business operations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="benefits-grid py-16 px-4 bg-gray-50">
        <div className="benefits-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="benefit-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <span className="emoji text-4xl mb-4 block">🔮</span>
              <h3 className="text-xl font-bold mb-4 text-gray-800">UNIFIED WORKFLOW</h3>
              <p className="text-gray-600">
                Replace disconnected tools with a single source of truth. All your projects, finances, and operations in one place.
              </p>
            </div>
            <div className="benefit-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <span className="emoji text-4xl mb-4 block">📈</span>
              <h3 className="text-xl font-bold mb-4 text-gray-800">PROACTIVE INSIGHTS</h3>
              <p className="text-gray-600">
                Our AI agents don't just report data—they analyze it, predict issues, and recommend solutions before problems arise.
              </p>
            </div>
            <div className="benefit-card bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <span className="emoji text-4xl mb-4 block">🚀</span>
              <h3 className="text-xl font-bold mb-4 text-gray-800">INCREASED PROFITABILITY</h3>
              <p className="text-gray-600">
                With real-time job costing, AI-powered estimates, and automated processes, increase your margins by 15-25%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing and Demo Section */}
      <div className="pricing-section py-16 px-4">
        <div className="pricing-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="plan-card bg-white p-8 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-2xl font-bold mb-2 text-gray-800">STARTER</h3>
              <p className="text-gray-600 mb-4">For small teams and freelancers.</p>
              <h4 className="text-3xl font-bold mb-6 text-blue-600">£99/mo</h4>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Up to 5 Projects</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Core Project Management</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Basic Accounting & Invoicing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>5GB Storage</span>
                </li>
              </ul>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300">
                Choose Plan
              </button>
            </div>
            
            <div className="plan-card bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 transform rotate-45 translate-x-4 -translate-y-2">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">PROFESSIONAL</h3>
              <p className="mb-4 opacity-90">For growing businesses.</p>
              <h4 className="text-3xl font-bold mb-6">£249/mo</h4>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span>Unlimited Projects</span>
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span>All Starter Features</span>
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span>Full AI Agent Suite</span>
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span>Third-Party Integrations</span>
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span>Priority Support</span>
                </li>
              </ul>
              <button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-4 rounded-lg transition duration-300">
                Choose Plan
              </button>
            </div>
            
            <div className="demo-form bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">REQUEST A DEMO</h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Company Name" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                >
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CortexBuildHomeView;
