/**
 * Debug utilities for development and troubleshooting
 */

// Environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Feature flags (can be extended)
export const featureFlags = {
  enableDebugLogs: isDevelopment,
  enablePerformanceMetrics: isDevelopment,
  enableMockData: false,
};

/**
 * Log API call details (only in development)
 */
export function logApiCall(
  method: string,
  endpoint: string,
  response: {
    status: number;
    data?: unknown;
    error?: string;
  },
  duration?: number
): void {
  if (!featureFlags.enableDebugLogs) return;

  const emoji = response.status < 400 ? '✅' : response.status < 500 ? '⚠️' : '❌';
  const durationStr = duration ? ` (${duration.toFixed(0)}ms)` : '';

  console.group(`${emoji} API: ${method} ${endpoint}${durationStr}`);
  console.log('Status:', response.status);
  if (response.data) {
    console.log('Data:', response.data);
  }
  if (response.error) {
    console.error('Error:', response.error);
  }
  console.groupEnd();
}

/**
 * Log component render (for debugging re-renders)
 */
export function logRender(componentName: string, props?: Record<string, unknown>): void {
  if (!featureFlags.enableDebugLogs) return;
  console.log(`🔄 Render: ${componentName}`, props || '');
}

/**
 * Log state change
 */
export function logStateChange(
  stateName: string,
  oldValue: unknown,
  newValue: unknown
): void {
  if (!featureFlags.enableDebugLogs) return;
  console.log(`📝 State: ${stateName}`, { old: oldValue, new: newValue });
}

/**
 * Performance timer
 */
export function createTimer(label: string): () => number {
  if (!featureFlags.enablePerformanceMetrics) {
    return () => 0;
  }

  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  };
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: string): void {
  const contextStr = context ? ` [${context}]` : '';
  console.error(`❌ Error${contextStr}:`, error.message);
  if (isDevelopment) {
    console.error(error.stack);
  }
}

/**
 * Log warning
 */
export function logWarning(message: string, data?: unknown): void {
  if (!featureFlags.enableDebugLogs) return;
  console.warn(`⚠️ ${message}`, data || '');
}

/**
 * Log info
 */
export function logInfo(message: string, data?: unknown): void {
  if (!featureFlags.enableDebugLogs) return;
  console.info(`ℹ️ ${message}`, data || '');
}

/**
 * Check and log environment
 */
export function checkEnvironment(): void {
  if (!isDevelopment) return;

  console.group('🔧 Environment Check');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Dev:', isDevelopment);
  console.log('Prod:', isProduction);
  console.log('Base URL:', import.meta.env.BASE_URL);
  console.groupEnd();
}

/**
 * Debug storage contents
 */
export function debugStorage(): void {
  if (!isDevelopment) return;

  console.group('💾 Storage Debug');
  console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('User:', localStorage.getItem('user') ? 'Present' : 'Missing');
  console.log('PWA Dismissed:', localStorage.getItem('pwa-install-dismissed'));
  console.groupEnd();
}

/**
 * Assert condition (throws in development)
 */
export function assert(condition: boolean, message: string): void {
  if (!condition && isDevelopment) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Auto-run environment check in development
if (isDevelopment) {
  checkEnvironment();
}
