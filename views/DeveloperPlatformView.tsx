import React, { useState } from 'react';

const DeveloperPlatformView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('DeveloperPlatform');

  const menuItems = [
    { id: 'Home', label: 'Home' },
    { id: 'NeuralNetwork', label: 'The Neural Network' },
    { id: 'PlatformFeatures', label: 'Platform Features' },
    { id: 'Connectivity', label: 'Connectivity' },
    { id: 'DeveloperPlatform', label: 'Developer Platform' },
    { id: 'GetStarted', label: 'Get Started' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
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

      {/* Developer Hero */}
      <div className="developer-hero text-center py-16">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">👨‍💻 BUILD THE FUTURE OF CONSTRUCTION TECH</h1>
        <h2 className="text-3xl font-semibold mb-6 text-purple-600">DEVELOPER ECOSYSTEM</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join the first open developer platform for construction management, where innovation meets the building blocks of tomorrow.
        </p>
      </div>

      {/* Why Build Section */}
      <div className="why-build-section py-12">
        <div className="why-build-container max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-12 text-gray-800">WHY BUILD ON CORTEXBUILD?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="reason bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🧩</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">MODULAR ARCHITECTURE</h4>
              <p className="text-gray-600">
                Build self-contained modules that integrate seamlessly with our platform, allowing for easy deployment and maintenance.
              </p>
            </div>
            <div className="reason bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🔧</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">COMPLETE TOOLKIT</h4>
              <p className="text-gray-600">
                Access comprehensive APIs, SDKs, and documentation to build powerful integrations and extensions.
              </p>
            </div>
            <div className="reason bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">💰</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">MONETIZATION</h4>
              <p className="text-gray-600">
                Publish your modules to our marketplace and earn revenue from your innovations with a 70% revenue share.
              </p>
            </div>
            <div className="reason bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🌍</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">GLOBAL IMPACT</h4>
              <p className="text-gray-600">
                Your modules reach thousands of construction professionals worldwide, making a real impact on the industry.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="code-example py-12">
        <div className="code-container max-w-4xl mx-auto bg-gray-800 text-white p-8 rounded-xl">
          <h3 className="text-2xl font-bold mb-4 text-center text-purple-300">example-module.ts</h3>
          <pre className="text-sm overflow-x-auto">
            <code>{`import { CortexBuild } from '@cortexbuild/sdk';

export class SmartScheduler {
  async optimizeSchedule(project: Project) {
    // Access project data
    const tasks = await project.getTasks();

    // Run AI optimization
    const optimized = await this.ai.optimize(tasks);

    // Update schedule
    return project.updateSchedule(optimized);
  }
}`}</code>
          </pre>
          <div className="code-features flex flex-wrap justify-center gap-4 mt-4">
            <span className="bg-green-600 px-3 py-1 rounded-full text-sm">✓ Type-safe APIs</span>
            <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">✓ Real-time data</span>
            <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">✓ AI-powered</span>
          </div>
        </div>
      </div>

      {/* Sandbox Section */}
      <div className="sandbox-section py-16">
        <div className="sandbox-container max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-12 text-gray-800">DEVELOPER SANDBOX</h3>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Safe environment to build, test, and debug your modules with real data and scenarios.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="sandbox-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🛠️</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">BUILD & TEST</h4>
              <p className="text-gray-600">
                Create modules with our comprehensive SDK and test them in a secure sandbox environment.
              </p>
            </div>
            <div className="sandbox-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">📊</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">MONITOR PERFORMANCE</h4>
              <p className="text-gray-600">
                Track module performance, API usage, error rates, and user engagement metrics.
              </p>
            </div>
            <div className="sandbox-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🚀</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">DEPLOY INSTANTLY</h4>
              <p className="text-gray-600">
                One-click deployment to production with automatic versioning and rollback capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="marketplace-section py-12">
        <div className="marketplace-container max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold mb-8 text-center text-gray-800">MODULE MARKETPLACE</h3>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Publish your modules and reach thousands of construction professionals
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="marketplace-for-developers bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-md">
              <h4 className="text-2xl font-bold mb-4 text-blue-800">FOR DEVELOPERS</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Publish unlimited modules</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>70% revenue share</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Built-in payment processing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Marketing & promotion support</span>
                </li>
              </ul>
            </div>
            <div className="marketplace-for-users bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-md">
              <h4 className="text-2xl font-bold mb-4 text-green-800">FOR USERS</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Browse 100+ modules</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Community ratings & reviews</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>One-click installation</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Free & premium options</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section py-16 text-center">
        <h3 className="text-3xl font-bold mb-4 text-gray-800">START BUILDING TODAY</h3>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join our growing community of developers transforming the construction industry
        </p>
        <div className="buttons flex flex-wrap justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
            Get API Access
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
            View Documentation
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
            Join Community
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPlatformView;
