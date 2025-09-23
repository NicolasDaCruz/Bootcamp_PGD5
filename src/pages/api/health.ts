import { NextApiRequest, NextApiResponse } from 'next';

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: 'ok' | 'error';
    external_apis: 'ok' | 'error';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.0.0',
      services: {
        database: 'error',
        external_apis: 'error',
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
    });
  }

  try {
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    // Check database connectivity (simplified)
    let databaseStatus: 'ok' | 'error' = 'ok';
    try {
      // In a real implementation, you would test your database connection here
      // For now, we'll assume it's ok if Supabase URL is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        databaseStatus = 'error';
      }
    } catch (error) {
      databaseStatus = 'error';
    }

    // Check external APIs (simplified)
    let externalApisStatus: 'ok' | 'error' = 'ok';
    try {
      // In a real implementation, you would test your external API connections here
      // For now, we'll assume they're ok if API keys are configured
      if (!process.env.NEXT_PUBLIC_KICKSDB_API_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        externalApisStatus = 'error';
      }
    } catch (error) {
      externalApisStatus = 'error';
    }

    const overallStatus = databaseStatus === 'ok' && externalApisStatus === 'ok' ? 'ok' : 'error';

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: databaseStatus,
        external_apis: externalApisStatus,
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: memoryPercentage,
      },
    };

    // Set appropriate HTTP status
    const httpStatus = overallStatus === 'ok' ? 200 : 503;

    // Add cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(httpStatus).json(healthResponse);
  } catch (error) {
    console.error('Health check error:', error);

    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.0.0',
      services: {
        database: 'error',
        external_apis: 'error',
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
    });
  }
}