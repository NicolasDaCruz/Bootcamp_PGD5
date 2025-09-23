'use client';

import { usePrivacy } from '@/contexts/PrivacyContext';
import { Shield, Cookie, Database, Mail, FileText, Calendar, Globe, Users, Lock, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { showPrivacySettings } = usePrivacy();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Your privacy is important to us. This policy explains how we collect, use, and protect your data.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Your Privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={showPrivacySettings}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left"
            >
              <Cookie className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Cookie Settings</h3>
              <p className="text-sm text-gray-600">Manage your cookie preferences</p>
            </button>

            <button
              onClick={showPrivacySettings}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors text-left"
            >
              <Database className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Data Export</h3>
              <p className="text-sm text-gray-600">Download your personal data</p>
            </button>

            <button
              onClick={showPrivacySettings}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors text-left"
            >
              <Shield className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Privacy Rights</h3>
              <p className="text-sm text-gray-600">Learn about your rights</p>
            </button>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">

          {/* Data Collection */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We collect information to provide better services to our users. The types of data we collect include:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Name and contact details</li>
                    <li>• Email address and phone number</li>
                    <li>• Shipping and billing addresses</li>
                    <li>• Account credentials</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Pages visited and time spent</li>
                    <li>• Products viewed and purchased</li>
                    <li>• Search queries and filters used</li>
                    <li>• Device and browser information</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Data</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We use the collected data for the following purposes:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Essential Services</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Processing orders and payments</li>
                    <li>• Managing your account</li>
                    <li>• Customer support</li>
                    <li>• Security and fraud prevention</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Optional Services</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Personalized recommendations</li>
                    <li>• Marketing communications</li>
                    <li>• Website analytics</li>
                    <li>• Product improvements</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Cookie className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Cookies and Tracking</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We use cookies and similar technologies to enhance your experience:</p>

              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Necessary Cookies</h3>
                  <p className="text-sm">Required for basic website functionality, security, and your preferences.</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                  <p className="text-sm">Help us understand how visitors interact with our website.</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                  <p className="text-sm">Used to deliver personalized advertisements and measure campaign effectiveness.</p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Social Media Cookies</h3>
                  <p className="text-sm">Enable social sharing features and social media integration.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data Sharing</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We may share your data with:</p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Service Providers</h3>
                    <p className="text-sm">Payment processors, shipping companies, and cloud storage providers.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Legal Requirements</h3>
                    <p className="text-sm">When required by law, regulation, or legal process.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Business Transfers</h3>
                    <p className="text-sm">In case of merger, acquisition, or sale of assets.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>Under GDPR and other privacy laws, you have the following rights:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Access', description: 'Request a copy of your personal data' },
                  { title: 'Rectification', description: 'Correct inaccurate or incomplete data' },
                  { title: 'Erasure', description: 'Request deletion of your personal data' },
                  { title: 'Portability', description: 'Transfer your data to another service' },
                  { title: 'Object', description: 'Object to certain data processing' },
                  { title: 'Restrict', description: 'Limit how we process your data' }
                ].map((right, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-semibold text-gray-900">{right.title}</h3>
                    <p className="text-sm">{right.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We implement appropriate security measures to protect your personal data:</p>

              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Encryption of data in transit and at rest</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Regular security audits and vulnerability assessments</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Access controls and employee training</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Incident response and breach notification procedures</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We retain your personal data for the following periods:</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span>Account Information</span>
                  <span className="font-medium">While account is active</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span>Order History</span>
                  <span className="font-medium">7 years (legal requirement)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span>Analytics Data</span>
                  <span className="font-medium">26 months (anonymized)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span>Marketing Data</span>
                  <span className="font-medium">Until unsubscribed</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>If you have questions about this privacy policy or want to exercise your rights:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                  <p className="text-sm">
                    Email: <a href="mailto:privacy@sneakervault.com" className="text-blue-600 hover:text-blue-700">privacy@sneakervault.com</a><br />
                    Response time: Within 30 days
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Regulatory Authority</h3>
                  <p className="text-sm">
                    You can also lodge a complaint with your<br />
                    local data protection authority if you<br />
                    believe we've mishandled your data.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span>Posting the new policy on this page</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span>Sending you an email notification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span>Showing a banner on our website</span>
                </li>
              </ul>
              <p>
                Continued use of our services after changes constitute acceptance of the new policy.
              </p>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <button
            onClick={showPrivacySettings}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Manage Your Privacy Settings
          </button>
        </div>
      </div>
    </div>
  );
}