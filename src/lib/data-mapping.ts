// GDPR Data Mapping System
// This module tracks all personal data collection points and processing activities

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  lawfulBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retentionPeriod: string;
  isSpecialCategory: boolean; // Sensitive personal data under GDPR Article 9
}

export interface DataField {
  id: string;
  name: string;
  category: string;
  source: string;
  purpose: string[];
  processors: string[];
  transfers: string[];
  automated: boolean;
  encrypted: boolean;
}

export interface ProcessingActivity {
  id: string;
  name: string;
  description: string;
  dataFields: string[];
  purpose: string;
  lawfulBasis: DataCategory['lawfulBasis'];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DataSubject {
  id: string;
  type: 'customer' | 'prospect' | 'visitor' | 'employee' | 'supplier';
  rights: string[];
}

// Data Categories as per GDPR
export const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'identity',
    name: 'Identity Data',
    description: 'Information that can identify an individual',
    lawfulBasis: 'contract',
    retentionPeriod: 'While account is active + 3 years',
    isSpecialCategory: false
  },
  {
    id: 'contact',
    name: 'Contact Data',
    description: 'Communication details and addresses',
    lawfulBasis: 'contract',
    retentionPeriod: 'While account is active + 1 year',
    isSpecialCategory: false
  },
  {
    id: 'financial',
    name: 'Financial Data',
    description: 'Payment and billing information',
    lawfulBasis: 'contract',
    retentionPeriod: '7 years (legal requirement)',
    isSpecialCategory: false
  },
  {
    id: 'transaction',
    name: 'Transaction Data',
    description: 'Purchase history and payment details',
    lawfulBasis: 'contract',
    retentionPeriod: '7 years (legal requirement)',
    isSpecialCategory: false
  },
  {
    id: 'technical',
    name: 'Technical Data',
    description: 'Device, browser, and connection information',
    lawfulBasis: 'legitimate_interests',
    retentionPeriod: '26 months (anonymized after 13 months)',
    isSpecialCategory: false
  },
  {
    id: 'profile',
    name: 'Profile Data',
    description: 'Preferences, interests, and behavior',
    lawfulBasis: 'consent',
    retentionPeriod: 'While consent is valid',
    isSpecialCategory: false
  },
  {
    id: 'usage',
    name: 'Usage Data',
    description: 'How you use our website and services',
    lawfulBasis: 'legitimate_interests',
    retentionPeriod: '26 months',
    isSpecialCategory: false
  },
  {
    id: 'marketing',
    name: 'Marketing Data',
    description: 'Communication preferences and campaign data',
    lawfulBasis: 'consent',
    retentionPeriod: 'Until consent withdrawn',
    isSpecialCategory: false
  }
];

// Data Fields Mapping
export const DATA_FIELDS: DataField[] = [
  // Identity Data
  {
    id: 'first_name',
    name: 'First Name',
    category: 'identity',
    source: 'Registration Form',
    purpose: ['Account Management', 'Order Fulfillment', 'Customer Service'],
    processors: ['Supabase', 'Customer Service Team'],
    transfers: [],
    automated: false,
    encrypted: true
  },
  {
    id: 'last_name',
    name: 'Last Name',
    category: 'identity',
    source: 'Registration Form',
    purpose: ['Account Management', 'Order Fulfillment', 'Customer Service'],
    processors: ['Supabase', 'Customer Service Team'],
    transfers: [],
    automated: false,
    encrypted: true
  },
  {
    id: 'date_of_birth',
    name: 'Date of Birth',
    category: 'identity',
    source: 'Account Settings',
    purpose: ['Age Verification', 'Personalization'],
    processors: ['Supabase'],
    transfers: [],
    automated: false,
    encrypted: true
  },

  // Contact Data
  {
    id: 'email',
    name: 'Email Address',
    category: 'contact',
    source: 'Registration Form',
    purpose: ['Account Management', 'Order Updates', 'Marketing', 'Customer Service'],
    processors: ['Supabase', 'Resend', 'Customer Service Team'],
    transfers: ['Resend (Email Service)'],
    automated: true,
    encrypted: true
  },
  {
    id: 'phone',
    name: 'Phone Number',
    category: 'contact',
    source: 'Account Settings',
    purpose: ['Order Updates', 'Customer Service', 'SMS Marketing'],
    processors: ['Supabase', 'Customer Service Team'],
    transfers: [],
    automated: false,
    encrypted: true
  },
  {
    id: 'address',
    name: 'Address',
    category: 'contact',
    source: 'Checkout Form',
    purpose: ['Order Fulfillment', 'Shipping', 'Tax Calculation'],
    processors: ['Supabase', 'Shipping Partners'],
    transfers: ['Shipping Partners'],
    automated: true,
    encrypted: true
  },

  // Financial Data
  {
    id: 'payment_method',
    name: 'Payment Method',
    category: 'financial',
    source: 'Checkout Form',
    purpose: ['Payment Processing', 'Fraud Prevention'],
    processors: ['Stripe', 'Risk Assessment Team'],
    transfers: ['Stripe (Payment Processor)'],
    automated: true,
    encrypted: true
  },
  {
    id: 'billing_address',
    name: 'Billing Address',
    category: 'financial',
    source: 'Checkout Form',
    purpose: ['Payment Verification', 'Tax Compliance'],
    processors: ['Stripe', 'Accounting Team'],
    transfers: ['Stripe (Payment Processor)'],
    automated: true,
    encrypted: true
  },

  // Transaction Data
  {
    id: 'order_history',
    name: 'Order History',
    category: 'transaction',
    source: 'Order Processing',
    purpose: ['Order Management', 'Customer Service', 'Analytics', 'Recommendations'],
    processors: ['Supabase', 'Analytics Team', 'Customer Service Team'],
    transfers: [],
    automated: true,
    encrypted: true
  },
  {
    id: 'purchase_amount',
    name: 'Purchase Amount',
    category: 'transaction',
    source: 'Order Processing',
    purpose: ['Financial Reporting', 'Fraud Detection', 'Customer Segmentation'],
    processors: ['Supabase', 'Analytics Team', 'Finance Team'],
    transfers: [],
    automated: true,
    encrypted: true
  },

  // Technical Data
  {
    id: 'ip_address',
    name: 'IP Address',
    category: 'technical',
    source: 'Website Visits',
    purpose: ['Security', 'Fraud Prevention', 'Analytics', 'Geolocation'],
    processors: ['Server Logs', 'Analytics Tools', 'Security Team'],
    transfers: ['Analytics Partners'],
    automated: true,
    encrypted: false
  },
  {
    id: 'user_agent',
    name: 'Browser Information',
    category: 'technical',
    source: 'Website Visits',
    purpose: ['Technical Support', 'Website Optimization', 'Security'],
    processors: ['Server Logs', 'Development Team'],
    transfers: [],
    automated: true,
    encrypted: false
  },
  {
    id: 'device_id',
    name: 'Device ID',
    category: 'technical',
    source: 'Website/App Usage',
    purpose: ['Analytics', 'Personalization', 'Fraud Prevention'],
    processors: ['Analytics Tools', 'Security Team'],
    transfers: ['Analytics Partners'],
    automated: true,
    encrypted: false
  },

  // Profile Data
  {
    id: 'preferences',
    name: 'User Preferences',
    category: 'profile',
    source: 'Account Settings',
    purpose: ['Personalization', 'Recommendations', 'User Experience'],
    processors: ['Supabase', 'Recommendation Engine'],
    transfers: [],
    automated: true,
    encrypted: true
  },
  {
    id: 'wishlist',
    name: 'Wishlist Items',
    category: 'profile',
    source: 'User Actions',
    purpose: ['Personalization', 'Recommendations', 'Marketing'],
    processors: ['Supabase', 'Marketing Team'],
    transfers: [],
    automated: true,
    encrypted: true
  },
  {
    id: 'size_preferences',
    name: 'Size Preferences',
    category: 'profile',
    source: 'Purchase History',
    purpose: ['Personalization', 'Inventory Management', 'Recommendations'],
    processors: ['Supabase', 'Inventory Team'],
    transfers: [],
    automated: true,
    encrypted: true
  },

  // Usage Data
  {
    id: 'page_views',
    name: 'Page Views',
    category: 'usage',
    source: 'Website Analytics',
    purpose: ['Website Optimization', 'Content Improvement', 'User Research'],
    processors: ['Analytics Tools', 'Marketing Team'],
    transfers: ['Analytics Partners'],
    automated: true,
    encrypted: false
  },
  {
    id: 'search_queries',
    name: 'Search Queries',
    category: 'usage',
    source: 'Website Search',
    purpose: ['Search Improvement', 'Product Recommendations', 'Inventory Planning'],
    processors: ['Supabase', 'Product Team'],
    transfers: [],
    automated: true,
    encrypted: false
  },
  {
    id: 'session_duration',
    name: 'Session Duration',
    category: 'usage',
    source: 'Website Analytics',
    purpose: ['User Experience Optimization', 'Performance Analysis'],
    processors: ['Analytics Tools', 'Development Team'],
    transfers: ['Analytics Partners'],
    automated: true,
    encrypted: false
  },

  // Marketing Data
  {
    id: 'email_engagement',
    name: 'Email Engagement',
    category: 'marketing',
    source: 'Email Platform',
    purpose: ['Campaign Optimization', 'Segmentation', 'Personalization'],
    processors: ['Resend', 'Marketing Team'],
    transfers: ['Email Service Provider'],
    automated: true,
    encrypted: false
  },
  {
    id: 'campaign_responses',
    name: 'Campaign Responses',
    category: 'marketing',
    source: 'Marketing Campaigns',
    purpose: ['Campaign Analysis', 'ROI Measurement', 'Targeting'],
    processors: ['Marketing Team', 'Analytics Tools'],
    transfers: ['Marketing Partners'],
    automated: true,
    encrypted: false
  }
];

// Processing Activities
export const PROCESSING_ACTIVITIES: ProcessingActivity[] = [
  {
    id: 'account_management',
    name: 'Account Management',
    description: 'Creating and managing user accounts',
    dataFields: ['first_name', 'last_name', 'email', 'phone', 'preferences'],
    purpose: 'Providing account services and customer support',
    lawfulBasis: 'contract',
    dataSubjects: ['customer'],
    recipients: ['Customer Service Team', 'Technical Support'],
    retentionPeriod: 'While account is active + 3 years',
    securityMeasures: ['Encryption', 'Access Controls', 'Regular Audits'],
    riskLevel: 'medium'
  },
  {
    id: 'order_processing',
    name: 'Order Processing',
    description: 'Processing customer orders and payments',
    dataFields: ['email', 'address', 'payment_method', 'order_history', 'purchase_amount'],
    purpose: 'Fulfilling customer orders and processing payments',
    lawfulBasis: 'contract',
    dataSubjects: ['customer'],
    recipients: ['Payment Processors', 'Shipping Partners', 'Finance Team'],
    retentionPeriod: '7 years (legal requirement)',
    securityMeasures: ['PCI DSS Compliance', 'Encryption', 'Fraud Detection'],
    riskLevel: 'high'
  },
  {
    id: 'website_analytics',
    name: 'Website Analytics',
    description: 'Analyzing website usage and performance',
    dataFields: ['ip_address', 'user_agent', 'page_views', 'session_duration', 'search_queries'],
    purpose: 'Improving website performance and user experience',
    lawfulBasis: 'legitimate_interests',
    dataSubjects: ['visitor', 'customer'],
    recipients: ['Analytics Team', 'Development Team'],
    retentionPeriod: '26 months',
    securityMeasures: ['Data Anonymization', 'Access Controls'],
    riskLevel: 'low'
  },
  {
    id: 'marketing_campaigns',
    name: 'Marketing Campaigns',
    description: 'Sending marketing communications and measuring effectiveness',
    dataFields: ['email', 'preferences', 'email_engagement', 'campaign_responses', 'purchase_amount'],
    purpose: 'Marketing products and services to interested customers',
    lawfulBasis: 'consent',
    dataSubjects: ['customer', 'prospect'],
    recipients: ['Marketing Team', 'Email Service Providers'],
    retentionPeriod: 'Until consent withdrawn',
    securityMeasures: ['Opt-out Mechanisms', 'Encryption', 'Access Controls'],
    riskLevel: 'medium'
  },
  {
    id: 'personalization',
    name: 'Personalization',
    description: 'Providing personalized recommendations and content',
    dataFields: ['preferences', 'wishlist', 'order_history', 'size_preferences', 'page_views'],
    purpose: 'Enhancing user experience through personalization',
    lawfulBasis: 'consent',
    dataSubjects: ['customer'],
    recipients: ['Recommendation Engine', 'Product Team'],
    retentionPeriod: 'While consent is valid',
    securityMeasures: ['Pseudonymization', 'Access Controls'],
    riskLevel: 'medium'
  },
  {
    id: 'fraud_prevention',
    name: 'Fraud Prevention',
    description: 'Detecting and preventing fraudulent activities',
    dataFields: ['ip_address', 'device_id', 'payment_method', 'purchase_amount', 'user_agent'],
    purpose: 'Protecting customers and business from fraud',
    lawfulBasis: 'legitimate_interests',
    dataSubjects: ['customer', 'visitor'],
    recipients: ['Security Team', 'Risk Assessment Team'],
    retentionPeriod: '3 years',
    securityMeasures: ['Real-time Monitoring', 'Machine Learning', 'Access Controls'],
    riskLevel: 'high'
  }
];

// Data Subjects
export const DATA_SUBJECTS: DataSubject[] = [
  {
    id: 'customer',
    type: 'customer',
    rights: ['access', 'rectification', 'erasure', 'portability', 'object', 'restrict']
  },
  {
    id: 'prospect',
    type: 'prospect',
    rights: ['access', 'rectification', 'erasure', 'object', 'restrict']
  },
  {
    id: 'visitor',
    type: 'visitor',
    rights: ['access', 'object', 'restrict']
  }
];

// Utility Functions
export class DataMappingService {

  static getDataByCategory(categoryId: string): DataField[] {
    return DATA_FIELDS.filter(field => field.category === categoryId);
  }

  static getProcessingActivitiesForField(fieldId: string): ProcessingActivity[] {
    return PROCESSING_ACTIVITIES.filter(activity =>
      activity.dataFields.includes(fieldId)
    );
  }

  static getDataFieldsForUser(userId: string): { [category: string]: DataField[] } {
    // In a real implementation, this would query the database for user-specific data
    const categorizedData: { [category: string]: DataField[] } = {};

    DATA_CATEGORIES.forEach(category => {
      categorizedData[category.id] = this.getDataByCategory(category.id);
    });

    return categorizedData;
  }

  static generateDataExport(userId: string): any {
    // In a real implementation, this would fetch actual user data from the database
    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      dataMapping: {
        categories: DATA_CATEGORIES,
        fields: DATA_FIELDS,
        processingActivities: PROCESSING_ACTIVITIES
      },
      userData: {
        // This would contain actual user data
        identity: {
          firstName: '[User Data]',
          lastName: '[User Data]',
          email: '[User Data]'
        },
        // ... other categories
      },
      consents: {
        // Consent records
      },
      auditLog: {
        // Access and processing logs
      }
    };

    return exportData;
  }

  static validateGDPRCompliance(): { isCompliant: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if all data fields have proper lawful basis
    DATA_FIELDS.forEach(field => {
      const category = DATA_CATEGORIES.find(cat => cat.id === field.category);
      if (!category) {
        issues.push(`Data field '${field.name}' has no associated category`);
      }
    });

    // Check if all processing activities have security measures
    PROCESSING_ACTIVITIES.forEach(activity => {
      if (activity.securityMeasures.length === 0) {
        issues.push(`Processing activity '${activity.name}' has no security measures defined`);
      }

      if (activity.riskLevel === 'high' && activity.securityMeasures.length < 3) {
        issues.push(`High-risk processing activity '${activity.name}' needs more security measures`);
      }
    });

    // Check for proper consent mechanisms for consent-based processing
    const consentBasedActivities = PROCESSING_ACTIVITIES.filter(
      activity => activity.lawfulBasis === 'consent'
    );

    if (consentBasedActivities.length > 0) {
      // In a real implementation, verify consent management system is in place
    }

    return {
      isCompliant: issues.length === 0,
      issues
    };
  }

  static getDataRetentionReport(): any {
    const report = {
      generatedAt: new Date().toISOString(),
      categories: DATA_CATEGORIES.map(category => ({
        id: category.id,
        name: category.name,
        retentionPeriod: category.retentionPeriod,
        lawfulBasis: category.lawfulBasis,
        fieldsCount: DATA_FIELDS.filter(field => field.category === category.id).length
      })),
      upcomingDeletions: [
        // In a real implementation, this would query for data that needs to be deleted
      ],
      overdueDeletions: [
        // Data that should have been deleted already
      ]
    };

    return report;
  }
}

// Data Breach Response
export interface DataBreach {
  id: string;
  reportedAt: Date;
  discoveredAt: Date;
  description: string;
  affectedDataFields: string[];
  affectedUsers: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedToAuthority: boolean;
  usersNotified: boolean;
  mitigationSteps: string[];
  status: 'open' | 'investigating' | 'resolved';
}

export class DataBreachService {
  static reportBreach(breach: Omit<DataBreach, 'id' | 'reportedAt'>): DataBreach {
    const newBreach: DataBreach = {
      ...breach,
      id: `breach-${Date.now()}`,
      reportedAt: new Date()
    };

    // In a real implementation, this would:
    // 1. Log the breach in a secure system
    // 2. Trigger notification workflows
    // 3. Generate regulatory reports
    // 4. Initiate user notification if required

    return newBreach;
  }

  static shouldNotifyAuthority(breach: DataBreach): boolean {
    // Under GDPR, breaches likely to result in high risk must be reported within 72 hours
    return breach.severity === 'high' || breach.severity === 'critical';
  }

  static shouldNotifyUsers(breach: DataBreach): boolean {
    // Users must be notified if the breach is likely to result in high risk to their rights and freedoms
    return breach.severity === 'critical' ||
           breach.affectedDataFields.some(field => {
             const dataField = DATA_FIELDS.find(f => f.id === field);
             return dataField?.category === 'financial' || dataField?.category === 'identity';
           });
  }
}