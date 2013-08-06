/*******************************************************************************
 *  Code contributed to the webinos project
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Copyright 2011 Telecom Italia SpA
 * 
 ******************************************************************************/


(function () {
  "use strict";

  var os = require('os');
  var dslib = require('./decisionstorage.js');
  var JSV = require('JSV').JSV;
  var fs = require('fs');
  var xml2js = require('xml2js');
  var schema = require('./schema.json');
  var env = JSV.createEnvironment("json-schema-draft-03");
  var xmlParser = new xml2js.Parser(xml2js.defaults["0.2"]);
  var policyFile = null;
  var decisionStorage = null;
  var promptTimeout = 20000;
  var promptCallbacks = {};
  var notificationManager = require("webinos-utilities").webinosNotifications.notificationManager;
  var pmrlib = require('./rootPm.js');
  var pmr;

  var policyManager = function(policyFilename) {
    var self = this;

    //Root policy file location
    policyFile = policyFilename;

    // Register to receive notifications of prompt responses.
    notificationManager.on(notificationManager.notifyType.permissionResponse, promptResponse);

    checkPolicyFileExists(policyFile, function(err) {
      if (err) {
        console.log("Error reading/creating policy file: " + err);
      } else {
// TODO: at the moment validation of root policy file fails
//        self.isAWellFormedPolicyFile(policyFile
//          , function () {
            pmr = new pmrlib.rootPm(policyFile);
            //Loads decision storage module
            decisionStorage = new dslib.decisionStorage(policyFile);
            console.log("Policy file loaded");
//          }
//          , function () {
//            console.log("Policy file is not valid");
//          }
//        );
      }
    });
  };

  /**
   * This function checks that a policy file exists at the given path.  If it
   * does not exist, a copy of the default root policy is place in this location.
   */
  function checkPolicyFileExists(policyFile, cb) {
    var fs = require('fs');
    var path = require('path');
    var existsSync = fs.existsSync || Path.existsSync;
    if (!existsSync(policyFile)) {
      console.log("No policy file found, copying default policy instead");
      var defaultPolicyFile = path.resolve(path.join( __dirname , "..", "defaultRootPolicy.xml" ));
      if (!existsSync(defaultPolicyFile)) {
        return cb("No policy file exists, and no default policy exists either.");
      }
      copy(defaultPolicyFile, policyFile, cb);
    } else {
      return cb();
    }
  }

  /**
   * Copy file 'from' to 'to', returns by calling 'cb' exactly once, either
   * with no arguments or with an error.
   */
  function copy(from, to, cb) {
    var called = false;
    var fs = require('fs');
    var readStream = fs.createReadStream(from);
    var writeStream = fs.createWriteStream(to);

    readStream.on('error', function(err) { once(err) });
    writeStream.on('error', function(err) { once(err) });
    writeStream.on('close', function() { once() });

    readStream.pipe(writeStream);

    function once(err) {
      if (!called) {
        if (typeof err === "undefined") {
          cb();
        } else {
          cb(err);
        }
        called = true;
      } 
    }    
  }

  policyManager.prototype.getPolicyFilePath = function() {
    return policyFile;
  }
  policyManager.prototype.testRequest = function(request, cb){
    /*var result = {};
    if (!pmr) {
      console.log("Invalid policy file: request denied");
      result["effect"] = false;
      cb(result);
      return;
    }
    var  path = {};
    var res = pmr.testRequest(request, path);
    result["effect"] = res;
    console.log(JSON.stringify(path));
    result["path"] = path["path"];
    cb(result);*/
    var result = {};
    if (!pmr) {
      console.log("Invalid policy file: request denied");
      result["effect"] = false;
      cb(result);
      return;
    }
    var  path = {};
    var res = pmr.testRequest(request, path);
    result = path;
    result['effect'] = res;
    cb(result);
  }
  policyManager.prototype.enforceRequest = function(request, sessionId, noprompt, cb) {
    if (!pmr) {
      console.log("Invalid policy file: request denied")
      cb(false);
      return;
    }

    var res = pmr.enforceRequest(request);

    if(res > 1 && res < 5 && decisionStorage && noprompt == false) {
      var storedDecision = decisionStorage.checkDecision(request, sessionId);
      if(storedDecision == 0 || storedDecision == 1) {
        cb(storedDecision);
      } else {
        notifyPermissionRequest(res, request, sessionId, cb);
      }
    } else {
      //console.log("Policy Manager enforce request: "+JSON.stringify(request)+" - result is "+res);
      cb(res);
    }
  };

  policyManager.prototype.reloadPolicy = function () {
    //TODO: at the moment validation of root policy file fails
//    self.isAWellFormedPolicyFile(policyFile
//      , function () {
        pmr.reloadPolicy();
//      }
//      , function () {
//        console.log("Policy file is not valid");
//      }
//    );
  };

  policyManager.prototype.isAWellFormedPolicyFile = function (policyFilename, successCB, errorCB) {
    var data = fs.readFileSync(policyFilename);

    xmlParser.parseString(data, function (err, jsonData) {
      if (!err) {
        (env.validate(jsonData, schema).errors.length === 0) ? successCB() : errorCB();
      } else {
        errorCB();
      }
    });
  }

  function notifyPermissionRequest(promptType, request, sessionId, cb) {
    // Add permission request to notifications list.
    var notification = notificationManager.addNotification(notificationManager.notifyType.permissionRequest, { promptType: promptType, request: request, sessionId: sessionId });

    // Store the callback with the notification id.
    promptCallbacks[notification.id] = {
      callback: cb,
      request: request,
      sessionId: sessionId
    };

    // Create a timeout - deny permission after 20 secs.
    setTimeout(function() {
      // Prompt has timed out - check that the user didn't respond in the meantime.
      if (promptCallbacks.hasOwnProperty(notification.id)) {
        // Callback still exists => no user response received.
        var cb = promptCallbacks[notification.id].callback;
        delete promptCallbacks[notification.id];

        // Callback with 'denied'
        cb(1);
      }
    }, promptTimeout);
  }

	var storePermissionResponse = function(request, sessionId, reply) {
    var permit = false;
    var storeSession = false;
    var storePermanent = false;

    // Determine the policy decision and storage required based on the response.
    switch (reply) {
      case 0:
        // Deny always.
        permit = false;
        storePermanent = true;
        break;
      case 1:
        // Deny this session.
        permit = false;
        storeSession = true;
        break;
      case 2:
        // Deny this time.
        permit = false;
        break;
      case 3:
        // Allow this time.
        permit = true;
        break;
      case 4:
        // Allow this session.
        permit = true;
        storeSession = true;
        break;
      case 5:
        // Allow always.
        permit = true;
        storePermanent = true;
        break;
      default:
        permit = false;
        break;
    }
    if (storeSession || storePermanent) {
      decisionStorage.addDecision(request, sessionId, permit ? 0 : 1, storePermanent ? 0 : 1);
    }

    return permit;
  }

	var promptResponse = function(notify) {
    var token = notify.data.responseTo;
    var reply = notify.data.response;

    // Response from prompt received from user.
    // Check that the prompt hasn't timed out.
    if (promptCallbacks.hasOwnProperty(token)) {
      // Prompt still valid - get the details.
      var cb = promptCallbacks[token].callback;
      var request = promptCallbacks[token].request;
      var sessionId = promptCallbacks[token].sessionId;
      delete promptCallbacks[token];

      // Store the permission request response.
      var permit = storePermissionResponse(request, sessionId, reply);

      // Callback requires PERMIT == 0 and DENY == 1
      cb(permit === true ? 0 : 1);
  }
	};

  exports.policyManager = policyManager;

}());
