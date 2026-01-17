// AI Overview Click Tracking
// Captures #:~:text= fragment before GA4 strips it
(function() {
  // Check if URL contains the AI Overview indicator
  if (window.location.hash.includes(':~:text=')) {
    console.log('🎯 AI Overview visit detected!');
    
    // Wait for gtag to be available
    const sendEvent = () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'ai_overview_click', {
          'page_location': window.location.href,
          'page_path': window.location.pathname + window.location.search + window.location.hash
        });
        console.log('✅ ai_overview_click event sent to GA4');
      } else {
        console.warn('⚠️ gtag not loaded yet, retrying...');
        setTimeout(sendEvent, 100);
      }
    };
    
    // Send immediately or wait for page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', sendEvent);
    } else {
      sendEvent();
    }
  }
})();
