interface SystemsCheckResult {
  systems: any[];
  timestamp: number;
  isVisible: boolean;
}

class SystemsCheckStateService {
  private static STORAGE_KEY = 'systems_check_result';
  private static EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

  static save(systems: any[]): void {
    const result: SystemsCheckResult = {
      systems,
      timestamp: Date.now(),
      isVisible: true
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(result));
    window.dispatchEvent(new CustomEvent('systemsCheckResultUpdated', { detail: result }));
  }

  static get(): SystemsCheckResult | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    const result: SystemsCheckResult = JSON.parse(stored);
    
    // Check if expired (24 hours)
    if (Date.now() - result.timestamp > this.EXPIRY_TIME) {
      this.clear();
      return null;
    }

    return result;
  }

  static hide(): void {
    const result = this.get();
    if (result) {
      result.isVisible = false;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(result));
      window.dispatchEvent(new CustomEvent('systemsCheckResultUpdated', { detail: result }));
    }
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('systemsCheckResultUpdated', { detail: null }));
  }
}

export default SystemsCheckStateService;