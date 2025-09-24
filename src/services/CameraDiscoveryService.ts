import { supabase } from '@/integrations/supabase/client';
import { CameraConfiguration } from '@/entities/CameraConfiguration';

export interface CameraValidationResult {
  isValid: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
  capabilities: Record<string, any>;
  error?: string;
  responseTime?: number;
}

export class CameraDiscoveryService {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Exponential backoff

  static async validateCameraIP(ip: string, port: number = 8080, path: string = '/video'): Promise<CameraValidationResult> {
    const startTime = Date.now();
    
    try {
      // Use the camera proxy to validate the IP
      const { data, error } = await supabase.functions.invoke('camera-proxy', {
        body: { 
          cameraIp: ip, 
          port, 
          path,
          action: 'validate'
        }
      });

      if (error) {
        return {
          isValid: false,
          quality: 'unknown',
          capabilities: {},
          error: error.message || 'Validation failed'
        };
      }

      const responseTime = Date.now() - startTime;
      
      return {
        isValid: true,
        quality: this.determineQuality(responseTime),
        capabilities: data?.capabilities || {},
        responseTime
      };
    } catch (error) {
      return {
        isValid: false,
        quality: 'unknown',
        capabilities: {},
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  static async connectWithRetry(
    cameraConfig: Partial<CameraConfiguration>,
    maxRetries: number = 3
  ): Promise<CameraValidationResult> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.validateCameraIP(
          cameraConfig.camera_ip!,
          cameraConfig.camera_port || 8080,
          cameraConfig.camera_path || '/video'
        );

        if (result.isValid) {
          return result;
        }
        
        lastError = result.error || 'Validation failed';
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return {
      isValid: false,
      quality: 'unknown',
      capabilities: {},
      error: `Failed after ${maxRetries + 1} attempts: ${lastError}`
    };
  }

  static async discoverCameraCapabilities(ip: string, port: number = 8080): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase.functions.invoke('camera-proxy', {
        body: { 
          cameraIp: ip, 
          port,
          action: 'discover'
        }
      });

      if (error) {
        return {};
      }

      return data?.capabilities || {};
    } catch (error) {
      console.warn('Camera capability discovery failed:', error);
      return {};
    }
  }

  private static determineQuality(responseTime: number): 'excellent' | 'good' | 'poor' | 'unknown' {
    if (responseTime < 1000) return 'excellent';
    if (responseTime < 3000) return 'good';
    if (responseTime < 8000) return 'poor';
    return 'unknown';
  }

  static async updateCameraStatus(
    cameraId: string,
    status: CameraConfiguration['status'],
    error?: string
  ): Promise<void> {
    try {
      const updates: Partial<CameraConfiguration> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'connected') {
        updates.last_connected_at = new Date().toISOString();
        updates.retry_count = 0;
        updates.last_error = null;
      } else if (status === 'error' && error) {
        updates.last_error = error;
      }

      await supabase
        .from('camera_configurations')
        .update(updates)
        .eq('id', cameraId);
    } catch (updateError) {
      console.error('Failed to update camera status:', updateError);
    }
  }
}