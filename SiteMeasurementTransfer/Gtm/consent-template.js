const copyFromWindow = require('copyFromWindow');
const setDefaultConsentState = require('setDefaultConsentState');
const updateConsentState = require('updateConsentState');

if (data.initialize === true) {
  setDefaultConsentState({ykb_dataroid_storage: 'denied'});
}
const allowed = copyFromWindow('YkbPartnerTracking.analyticsAllowed') === true;
updateConsentState({ykb_dataroid_storage: allowed ? 'granted' : 'denied'});
data.gtmOnSuccess();
