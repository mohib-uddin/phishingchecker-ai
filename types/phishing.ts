export interface AnalysisResult {
    is_phishing: boolean;
    key_indicators: string[];
    analysis_details: string;
    security_recommendation: string;
  }
  
  export interface ScanRecord {
    id: string;
    message: string;
    result: AnalysisResult;
    timestamp: number;
    language: string;
  }
  
  export interface AppStats {
    totalScans: number;
    threatsFound: number;
    safeMessages: number;
  }
  