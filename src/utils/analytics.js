// utils/analytics.js - Analytics tracking
export const trackUserAction = (action, data = {}) => {
  console.log('📊 User Action:', action, data);
  
  // TODO: Send to actual analytics service
  if (window.gtag) {
    window.gtag('event', action, {
      custom_parameter_1: JSON.stringify(data)
    });
  }

}