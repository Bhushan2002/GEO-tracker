// AI Overview Click Tracking - Using Performance API
// This captures :~:text= fragments before browsers strip them
(function() {
  console.log('🔍 Checking for AI Overview visit...');
  
  // Method 1: Performance API (most reliable - captures original URL)
  const checkPerformanceAPI = () => {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0];
      if (navEntry && navEntry.name && navEntry.name.includes(':~:text=')) {
        console.log('🎯 AI Overview visit detected via Performance API!');
        console.log('Original URL:', navEntry.name);
        return true;
      }
    } catch (e) {
      console.warn('Performance API check failed:', e);
    }
    return false;
  };
  
  // Method 2: Fallback - Check document.URL immediately
  const checkDocumentURL = () => {
    if (document.URL && document.URL.includes(':~:text=')) {
      console.log('🎯 AI Overview visit detected via document.URL!');
      console.log('Original URL:', document.URL);
      return true;
    }
    return false;
  };
  
  const isAIOverview = checkPerformanceAPI() || checkDocumentURL();
  
  if (isAIOverview) {
    // Wait for gtag to be available and send event
    const sendEvent = () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'ai_overview_click', {
          'page_location': window.location.href,
          'page_path': window.location.pathname,
          'detection_method': checkPerformanceAPI() ? 'performance_api' : 'document_url'
        });
        console.log('✅ ai_overview_click event sent to GA4');
      } else {
        console.warn('⚠️ gtag not loaded yet, retrying in 100ms...');
        setTimeout(sendEvent, 100);
      }
    };
    
    // Send immediately or wait for page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', sendEvent);
    } else {
      sendEvent();
    }
  } else {
    console.log('ℹ️ No AI Overview indicators found');
  }
})();
