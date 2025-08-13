import { useState, useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  apiResponseTime: number;
  renderTime: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Monitor inicial page load
    const loadTime = performance.now();
    
    // Monitor API response times
    const originalFetch = window.fetch;
    let apiStartTime: number;
    
    window.fetch = async (...args) => {
      apiStartTime = performance.now();
      const response = await originalFetch(...args);
      const apiResponseTime = performance.now() - apiStartTime;
      
      setMetrics(prev => ({
        ...prev,
        loadTime: loadTime,
        apiResponseTime: Math.round(apiResponseTime),
        renderTime: prev?.renderTime || 0
      }));
      
      return response;
    };

    // Monitor render time
    const renderStart = performance.now();
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      setMetrics(prev => ({
        ...prev,
        loadTime: loadTime,
        apiResponseTime: prev?.apiResponseTime || 0,
        renderTime: Math.round(renderTime)
      }));
    });

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!metrics || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Load: {Math.round(metrics.loadTime)}ms</div>
      <div>API: {metrics.apiResponseTime}ms</div>
      <div>Render: {metrics.renderTime}ms</div>
    </div>
  );
}