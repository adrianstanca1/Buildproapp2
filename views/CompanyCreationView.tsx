import React, { useState } from 'react';
import { Building2, User, Mail, Lock, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { db } from '@/services/db';
import { useAuth } from '@/contexts/AuthContext';

const CompanyCreationView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Company info
  const [companyName, setCompanyName] = useState('');
  const [plan, setPlan] = useState('Starter');
  
  // Step 2: Owner info
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  const validateStep1 = () => {
    if (!companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    setError(null);
    return true;
  };
  
  const validateStep2 = () => {
    if (!ownerName.trim()) {
      setError('Owner name is required');
      return false;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    setError(null);
    return true;
  };
  
  const handleCreateCompany = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create the company and owner account
      const result = await db.createCompany({
        name: companyName,
        ownerEmail,
        ownerName,
        plan
      });
      
      // Log the user in with the new account
      await login(ownerEmail, ownerPassword);
      
      // Complete the onboarding
      onComplete();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-center">Create Your Company</h1>
          <p className="text-indigo-200 text-center mt-1">
            Step {step} of 2
          </p>
          
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-white text-indigo-600' : 'bg-indigo-500/30 text-indigo-200'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="h-1 w-16 bg-indigo-500/50"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-white text-indigo-600' : 'bg-indigo-500/30 text-indigo-200'
            }`}>
              {step === 2 ? '2' : step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
              <p className="text-gray-600 text-sm mb-4">
                Tell us about your company. You'll be the owner with full administrative access.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Starter">Starter - Free</option>
                  <option value="Business">Business - $99/month</option>
                  <option value="Enterprise">Enterprise - $299/month</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Owner Account</h2>
              <p className="text-gray-600 text-sm mb-4">
                Create your owner account. You'll have full administrative access to your company.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Create a secure password"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateCompany}
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Company
                      <Building2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-6 text-gray-600 text-sm text-center max-w-md">
        By creating a company, you agree to our Terms of Service and Privacy Policy. 
        You'll be the primary administrator with full access to manage users and settings.
      </p>
    </div>
  );
};

export default CompanyCreationView;