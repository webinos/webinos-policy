(function () {
    "use strict";
    var pm, policyViewer;
    var pmlib = require('./policymanager.js');
    exports.setWebinosPath = function(webinosPath) {
        var policyFile = require("path").join(webinosPath, "policies", "policy.xml");
        pm = new pmlib.policyManager(policyFile);
        //TODO: polic editor for the review - remove it!
        if(__EnablePolicyEditor) {
          policyViewer = new require('../viewer/policyviewerserver.js').policyViewer(pm);
        }
    }
    exports.setRPCHandler = function(rpc) {
        rpc.registerPolicycheck(handleMessage);
    };

    // Expose the policy manager to allow prompt responses to be processed later.
    exports.getPolicyManager = function() {
      return pm;
    };

/**
 * Handles a new JSON RPC message (as string)
 */
function handleMessage() {
    var callback = arguments[2];
    if (arguments[0].jsonrpc && arguments[0].method) {

        var rpcRequest = arguments[0];
        var id = rpcRequest.id;
        if (typeof id === 'undefined') return;

        var apiFeatureID, apiFeature,
            apiFeaturesMap = {
                'ServiceDiscovery':'http://webinos.org/api/discovery',
                'Dashboard':'http://webinos.org/api/dashboard'
            };
        var serviceId = null;

        var idx = rpcRequest.method.lastIndexOf('@');

        if (idx == -1) {
            idx = rpcRequest.method.lastIndexOf('.');
            apiFeatureID = rpcRequest.method.substring(0, idx);
            apiFeature = apiFeaturesMap[apiFeatureID];
        } else {
            apiFeature = rpcRequest.method.substring(0, idx);
            serviceId = rpcRequest.method.substring(idx+1);
            idx = serviceId.indexOf('.');
            serviceId = serviceId.substring(0, idx);
        }

        //If no feature is associated to the request, then allow
        if(apiFeature == null) {
            console.log('Policy manager: no feature found');
            return true;
        }

        var items = arguments[1].split('/');
        var userAndRequestor = [];

        // append user
        userAndRequestor.push(items[0]);
        // append requestor
        userAndRequestor.push(items[1]);

        var appId = null;
        if (items.length == 3 && items[2].indexOf('IID') == 0) {
            appId = items[2].substring(3).split('_')[0];
        }

        var sessionId = arguments[1].replace(/\//g, "_").replace(/@/g, "_");

        var request = {
            'subjectInfo' : { 'userId' : userAndRequestor[0] },
            'deviceInfo'  : { 'requestorId' : userAndRequestor[1] },
            'resourceInfo' : { 'apiFeature': apiFeature, 'serviceId': serviceId }
        };

        if (appId != null) {
            request.widgetInfo = {};
            request.widgetInfo.id = appId;
        }

        //Extract feature parameters (if needed)
        switch(apiFeature) {
            case 'http://webinos.org/api/discovery':
                request.resourceInfo['paramFeature'] = arguments[0]['params'][0]['api'];
                break;
            default:
        }

        // Ask policy manager to enforce the request
        pm.enforceRequest(request, sessionId, false, function(res) {
          callback(res === 0 ? true : false);
        });
      } else {
        //If no feature is specified then callback now with permit.
        callback(true);
    }
}

}());
