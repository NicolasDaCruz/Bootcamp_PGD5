'use client';

import { useState } from 'react';
import {
  DATA_CATEGORIES,
  DATA_FIELDS,
  PROCESSING_ACTIVITIES,
  DATA_SUBJECTS,
  DataMappingService,
  type DataCategory,
  type DataField,
  type ProcessingActivity
} from '@/lib/data-mapping';
import {
  Database,
  Shield,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Eye,
  FileText,
  Download,
  Search,
  Filter,
  Info,
  ExternalLink
} from 'lucide-react';

interface DataMappingDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DataMappingDashboard({ isVisible, onClose }: DataMappingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'fields' | 'activities' | 'compliance'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isVisible) return null;

  const complianceCheck = DataMappingService.validateGDPRCompliance();
  const retentionReport = DataMappingService.getDataRetentionReport();

  const filteredFields = DATA_FIELDS.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.purpose.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || field.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'categories', label: 'Data Categories', icon: Database },
    { id: 'fields', label: 'Data Fields', icon: FileText },
    { id: 'activities', label: 'Processing Activities', icon: Activity },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Compliance Status */}
      <div className={`p-6 rounded-lg ${complianceCheck.isCompliant ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center space-x-3">
          {complianceCheck.isCompliant ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-red-600" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              GDPR Compliance Status: {complianceCheck.isCompliant ? 'Compliant' : 'Issues Found'}
            </h3>
            <p className="text-gray-600">
              {complianceCheck.isCompliant
                ? 'All data processing activities meet GDPR requirements'
                : `${complianceCheck.issues.length} compliance issues need attention`
              }
            </p>
          </div>
        </div>
        {!complianceCheck.isCompliant && (
          <div className="mt-4">
            <ul className="text-sm text-red-700 space-y-1">
              {complianceCheck.issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Data Categories</p>
              <p className="text-2xl font-bold text-gray-900">{DATA_CATEGORIES.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Data Fields</p>
              <p className="text-2xl font-bold text-gray-900">{DATA_FIELDS.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Processing Activities</p>
              <p className="text-2xl font-bold text-gray-900">{PROCESSING_ACTIVITIES.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Data Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{DATA_SUBJECTS.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lawful Basis Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lawful Basis Distribution</h3>
        <div className="space-y-3">
          {Object.entries(
            DATA_CATEGORIES.reduce((acc, category) => {
              acc[category.lawfulBasis] = (acc[category.lawfulBasis] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([basis, count]) => (
            <div key={basis} className="flex items-center justify-between py-2">
              <span className="capitalize text-gray-700">{basis.replace('_', ' ')}</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / DATA_CATEGORIES.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['low', 'medium', 'high'] as const).map(risk => {
            const count = PROCESSING_ACTIVITIES.filter(activity => activity.riskLevel === risk).length;
            const colors = {
              low: 'text-green-600 bg-green-100',
              medium: 'text-yellow-600 bg-yellow-100',
              high: 'text-red-600 bg-red-100'
            };

            return (
              <div key={risk} className={`p-4 rounded-lg ${colors[risk]}`}>
                <div className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium capitalize">{risk} Risk Activities</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Data Categories</h3>
        <p className="text-gray-600 text-sm">Classification of personal data types under GDPR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DATA_CATEGORIES.map((category) => {
          const fieldsCount = DATA_FIELDS.filter(field => field.category === category.id).length;

          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  category.isSpecialCategory
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {category.isSpecialCategory ? 'Special Category' : 'Regular Data'}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{category.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fields:</span>
                  <span className="font-medium">{fieldsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lawful Basis:</span>
                  <span className="font-medium capitalize">{category.lawfulBasis.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Retention:</span>
                  <span className="font-medium">{category.retentionPeriod}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFields = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {DATA_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Security
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFields.map((field) => {
                const category = DATA_CATEGORIES.find(cat => cat.id === field.category);

                return (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{field.name}</div>
                          <div className="text-sm text-gray-500">{field.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {field.encrypted && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Encrypted
                          </span>
                        )}
                        {field.automated && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Automated
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {field.purpose.slice(0, 2).join(', ')}
                        {field.purpose.length > 2 && (
                          <span className="text-gray-500"> +{field.purpose.length - 2} more</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderActivities = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Processing Activities</h3>
        <p className="text-gray-600 text-sm">Data processing operations and their compliance status</p>
      </div>

      <div className="space-y-4">
        {PROCESSING_ACTIVITIES.map((activity) => (
          <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{activity.name}</h3>
                <p className="text-gray-600 mt-1">{activity.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activity.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  activity.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.riskLevel.toUpperCase()} RISK
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Legal Basis</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {activity.lawfulBasis.replace('_', ' ')}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data Subjects</h4>
                <div className="flex flex-wrap gap-1">
                  {activity.dataSubjects.map(subject => (
                    <span key={subject} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Retention Period</h4>
                <p className="text-sm text-gray-600">{activity.retentionPeriod}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Data Fields ({activity.dataFields.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {activity.dataFields.slice(0, 5).map(fieldId => {
                      const field = DATA_FIELDS.find(f => f.id === fieldId);
                      return (
                        <span key={fieldId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {field?.name}
                        </span>
                      );
                    })}
                    {activity.dataFields.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{activity.dataFields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Security Measures</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {activity.securityMeasures.map((measure, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <Shield className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">GDPR Compliance Dashboard</h3>
        <p className="text-gray-600 text-sm">Monitor compliance status and generate reports</p>
      </div>

      {/* Compliance Overview */}
      <div className={`p-6 rounded-lg ${complianceCheck.isCompliant ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {complianceCheck.isCompliant ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {complianceCheck.isCompliant ? 'Fully Compliant' : 'Compliance Issues Detected'}
              </h3>
              <p className="text-gray-600">
                Last checked: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Run Full Audit
          </button>
        </div>

        {!complianceCheck.isCompliant && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Issues to Address:</h4>
            <ul className="space-y-2">
              {complianceCheck.issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-3 text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Data Retention Report */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Retention Report</h3>
          <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="space-y-4">
          {retentionReport.categories.map((category: any) => (
            <div key={category.id} className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <p className="text-sm text-gray-600">{category.fieldsCount} fields</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{category.retentionPeriod}</p>
                <p className="text-xs text-gray-500 capitalize">{category.lawfulBasis.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left">
          <FileText className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-900">Generate DPO Report</h3>
          <p className="text-sm text-gray-600">Create comprehensive data protection report</p>
        </button>

        <button className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors text-left">
          <Users className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="font-medium text-gray-900">Audit User Consents</h3>
          <p className="text-sm text-gray-600">Review all user consent records</p>
        </button>

        <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors text-left">
          <Clock className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-medium text-gray-900">Review Retention</h3>
          <p className="text-sm text-gray-600">Check data due for deletion</p>
        </button>
      </div>

      {/* Regulatory Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Regulatory Requirements</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Data breach notification within 72 hours to supervisory authority</li>
              <li>• User notification for high-risk breaches without undue delay</li>
              <li>• Respond to data subject requests within 30 days</li>
              <li>• Maintain records of processing activities</li>
              <li>• Conduct Data Protection Impact Assessments for high-risk processing</li>
            </ul>
            <a
              href="https://gdpr.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 mt-3 text-sm"
            >
              <span>Learn more about GDPR</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Data Mapping Dashboard</h2>
              <p className="text-gray-600">GDPR compliance and data processing overview</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'fields' && renderFields()}
          {activeTab === 'activities' && renderActivities()}
          {activeTab === 'compliance' && renderCompliance()}
        </div>
      </div>
    </div>
  );
}