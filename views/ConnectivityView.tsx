import React, { useState } from 'react';
import { Page } from '@/types';

const ConnectivityView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.CONNECTIVITY);

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
                      
                      const targetPage = pageMap[item.id] || Page.CONNECTIVITY;
                      setPage(targetPage);
                      setCurrentPage(targetPage);
                    }}
                    className={`${currentPage === (item.id === 'Home' ? Page.CORTEX_BUILD_HOME :
                                  item.id === 'NeuralNetwork' ? Page.NEURAL_NETWORK :
                                  item.id === 'PlatformFeatures' ? Page.PLATFORM_FEATURES :
                                  item.id === 'Connectivity' ? Page.CONNECTIVITY :
                                  item.id === 'DeveloperPlatform' ? Page.DEVELOPER_PLATFORM :
                                  Page.CONNECTIVITY)
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

      {/* Connectivity Header */}
      <div className="connectivity-header text-center py-16">
        <h2 className="text-4xl font-bold mb-6 text-gray-800">SEAMLESSLY CONNECTED, INFINITELY SCALABLE</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Enterprise-grade integrations that grow with your business, connecting every aspect of your construction operations.
        </p>
      </div>

      {/* Integration Categories */}
      <div className="integration-categories py-12">
        <div className="categories-container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="integration-category bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🏦</span>
              <h3 className="text-xl font-bold mb-4 text-center text-blue-600">FINANCIAL INTEGRATIONS</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Open Banking APIs</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Xero & QuickBooks</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Payment Gateways</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Tax Authorities (HMRC, IRS)</span>
                </li>
              </ul>
            </div>
            
            <div className="integration-category bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🏢</span>
              <h3 className="text-xl font-bold mb-4 text-center text-green-600">BUSINESS TOOLS</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Microsoft 365</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Google Workspace</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Slack & Teams</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Email Integration</span>
                </li>
              </ul>
            </div>
            
            <div className="integration-category bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🏗️</span>
              <h3 className="text-xl font-bold mb-4 text-center text-purple-600">CONSTRUCTION PLATFORMS</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>BIM Software (Revit, AutoCAD)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Project Management Tools</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Equipment Tracking</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Supplier Networks</span>
                </li>
              </ul>
            </div>
            
            <div className="integration-category bg-white p-8 rounded-xl shadow-md">
              <span className="emoji text-4xl mb-4 block text-center">🤖</span>
              <h3 className="text-xl font-bold mb-4 text-center text-indigo-600">AI & ANALYTICS</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Google Gemini API</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Custom ML Models</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Data Warehouses</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>BI Tools</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="security-section py-16">
        <div className="security-container max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold mb-12 text-center text-gray-800">ENTERPRISE-GRADE SECURITY & COMPLIANCE</h3>
          <div className="security-features grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="security-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🔒</span>
              <h4 className="text-xl font-bold mb-2 text-center text-gray-800">END-TO-END ENCRYPTION</h4>
              <p className="text-gray-600 text-center">
                All data encrypted at rest and in transit using industry-standard AES-256 encryption protocols.
              </p>
            </div>
            <div className="security-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🛡️</span>
              <h4 className="text-xl font-bold mb-2 text-center text-gray-800">MULTI-FACTOR AUTHENTICATION</h4>
              <p className="text-gray-600 text-center">
                Secure access with MFA, SSO, and role-based access control to protect your sensitive information.
              </p>
            </div>
            <div className="security-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">✅</span>
              <h4 className="text-xl font-bold mb-2 text-center text-gray-800">COMPLIANCE CERTIFIED</h4>
              <p className="text-gray-600 text-center">
                SOC 2 Type II, GDPR, ISO 27001 certified to meet the highest security and privacy standards.
              </p>
            </div>
            <div className="security-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🔍</span>
              <h4 className="text-xl font-bold mb-2 text-center text-gray-800">24/7 MONITORING</h4>
              <p className="text-gray-600 text-center">
                Continuous security monitoring with real-time threat detection and automated response systems.
              </p>
            </div>
            <div className="security-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">💾</span>
              <h4 className="text-xl font-bold mb-2 text-center text-gray-800">AUTOMATED BACKUPS</h4>
              <p className="text-gray-600 text-center">
                Daily automated backups with geographically distributed storage for maximum data protection.
              </p>
            </div>
            <div className="security-feature bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🔐</span>
              <h4 className="text-xl font-bold mb-2 text-center text-gray-800">DATA PRIVACY</h4>
              <p className="text-gray-600 text-center">
                Your data is yours. We never sell or share your information with third parties for marketing purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics py-12">
        <div className="metrics-container max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="metric bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-blue-600 mb-2">99.9%</h3>
              <p className="text-gray-600">Uptime SLA</p>
            </div>
            <div className="metric bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-green-600 mb-2">&lt;100ms</h3>
              <p className="text-gray-600">API Response Time</p>
            </div>
            <div className="metric bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-purple-600 mb-2">Unlimited</h3>
              <p className="text-gray-600">Projects</p>
            </div>
            <div className="metric bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-3xl font-bold text-orange-600 mb-2">Petabyte</h3>
              <p className="text-gray-600">Scale Storage</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Tools */}
      <div className="api-tools py-12">
        <div className="tools-container max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-12 text-gray-800">API & DEVELOPER TOOLS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="tool bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">🔌</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">RESTFUL API</h4>
              <p className="text-gray-600">
                Complete REST API with comprehensive documentation, SDKs, and real-time data access.
              </p>
            </div>
            <div className="tool bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">⚡</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">WEBHOOKS</h4>
              <p className="text-gray-600">
                Real-time event notifications for critical system events and data changes.
              </p>
            </div>
            <div className="tool bg-white p-6 rounded-xl shadow-md">
              <span className="emoji text-3xl mb-4 block text-center">📚</span>
              <h4 className="text-xl font-bold mb-2 text-gray-800">DEVELOPER PORTAL</h4>
              <p className="text-gray-600">
                Interactive API documentation, testing tools, and comprehensive developer resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityView;