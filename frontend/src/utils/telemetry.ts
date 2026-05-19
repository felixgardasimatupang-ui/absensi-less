// Simple telemetry utility for logging events
// In production, this could be replaced with a service like Sentry, Mixpanel, etc.

export type TelemetryEventType = 
  | 'logout_failure'
  | 'api_error'
  | 'custom';

export interface TelemetryEvent {
  type: TelemetryEventType;
  message: string;
  severity: 'info' | 'warn' | 'error';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class Telemetry {
  private readonly endpoint?: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint;
  }

  public log(event: TelemetryEvent): void {
    // Log to console for development
    console[event.severity === 'error' ? 'error' : event.severity === 'warn' ? 'warn' : 'log'](
      `[TELEMETRY] ${event.type}: ${event.message}`,
      event.metadata
    );

    // In production, send to endpoint if configured
    // if (this.endpoint && typeof window !== 'undefined') {
    //   fetch(this.endpoint, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(event),
    //   }).catch(err => console.error('Failed to send telemetry:', err));
    // }
  }

  public logoutFailure(error: unknown, metadata?: Record<string, unknown>) {
    this.log({
      type: 'logout_failure',
      message: 'Logout request failed',
      severity: 'error',
      timestamp: Date.now(),
      metadata: { error: error instanceof Error ? error.message : String(error), ...metadata },
    });
  }

  public apiError(endpoint: string, error: unknown, metadata?: Record<string, unknown>) {
    this.log({
      type: 'api_error',
      message: `API request failed: ${endpoint}`,
      severity: 'error',
      timestamp: Date.now(),
      metadata: { endpoint, error: error instanceof Error ? error.message : String(error), ...metadata },
    });
  }

  public custom(type: string, message: string, severity: 'info' | 'warn' | 'error' = 'info', metadata?: Record<string, unknown>) {
    this.log({
      type: `custom_${type}` as TelemetryEventType,
      message,
      severity,
      timestamp: Date.now(),
      metadata,
    });
  }
}

// Singleton instance
export const telemetry = new Telemetry(import.meta.env.VITE_TELEMETRY_ENDPOINT);