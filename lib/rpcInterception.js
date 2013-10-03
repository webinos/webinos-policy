(function () {
    "use strict";
    var pm, policyViewer;
    var pmlib = require('./policymanager.js');

    exports.initialize = function(rpc, webinosPath, notificationManager) {
      rpc.registerPolicycheck(handleMessage);

        var policyFile = require("path").join(webinosPath, "policies", "rootPolicy.xml");
        pm = new pmlib.policyManager(policyFile);
      pm.initialisePrompts(notificationManager);

        //TODO: polic editor for the review - remove it!
        if(__EnablePolicyEditor) {
          policyViewer = new require('../viewer/policyviewerserver.js').policyViewer(pm);
        }
    }

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
            return callback(true);
        }

        var items = arguments[1].split('/');
        var userAndRequestor = [];

        // append user
        userAndRequestor.push(items[0]);

        var appId = null;
        // enrolled PZP
        if (items.length == 3) {
            // append requestor
            userAndRequestor.push(items[1]);
            if (items[2].indexOf('IID') == 0 || items[2].indexOf('BID') == 0) {
                appId = items[2].substring(3).split(':')[0];
            }
        }
        // virgin PZP
        else if (items.length == 2) {
            // append requestor
            userAndRequestor.push(items[0]);
            if (items[1].indexOf('IID') == 0 || items[1].indexOf('BID') == 0) {
                appId = items[1].substring(3).split(':')[0];
            }
        }

        var sessionId = arguments[1].replace(/\//g, "_").replace(/@/g, "_");

        var request = {
            'subjectInfo' : { 'userId' : userAndRequestor[0] },
            'resourceInfo' : { 'apiFeature': apiFeature, 'serviceId': serviceId }
        };

        if (userAndRequestor[1]) {
            request.deviceInfo = { 'requestorId' : userAndRequestor[1] };
        }
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
