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
  var logger = require('webinos-utilities').webinosLogging(__filename) || console;

  var decisionStorage = null;
  var promptTimeout = 30000;
  var pmrlib = require('./rootPm.js');

  var events = require('events');
  var eventEmitter = new events.EventEmitter();
  
  var policyManager = function(policyFilename) {
    //Root policy file location
    this.policyFile = policyFilename;

    this.pmr;
    this.genericURI = {};
    this.promptCallbacks = {};

    var self = this;

    try {
      var PzpAPI = require(require('path').join(require.main.paths[0], '..', 'lib', 'pzp_sessionHandling.js'));

      var getOwnerId = function() {
        var owner = PzpAPI.getInstance().getPzhId();
        if (!owner) {
          owner = PzpAPI.getDeviceName();
        }
        return owner;
      }
      this.genericURI = {
        'http://webinos.org/subject/id/PZ-Owner': getOwnerId(),
        'http://webinos.org/subject/id/known': PzpAPI.getInstance().getTrustedList('pzh')
      }

      var updateEnrollmentStatus = function () {
        self.genericURI['http://webinos.org/subject/id/PZ-Owner'] = getOwnerId();
        self.genericURI['http://webinos.org/subject/id/known'] = PzpAPI.getInstance().getTrustedList('pzh');
        self.pmr.reloadPolicy(self.genericURI);
      }

      var updateFriends = function () {
        self.genericURI['http://webinos.org/subject/id/known'] = PzpAPI.getInstance().getTrustedList('pzh');
        self.pmr.reloadPolicy(self.genericURI);
      }
    
      eventEmitter.on('updateEnrollmentStatus', updateEnrollmentStatus);
      eventEmitter.on('updateFriends', updateFriends);
    } catch(e) {
        logger.log("Cannot get info about PZ-Owner and Known PZHs");
    }

    checkPolicyFileExists(this.policyFile, function(err) {
      if (err) {
        logger.log("Error reading/creating policy file: " + err);
      } else {
// TODO: at the moment validation of root policy file fails
//        self.isAWellFormedPolicyFile(policyFile
//          , function () {
            self.pmr = new pmrlib.rootPm(self.policyFile, self.genericURI);
            //Loads decision storage module
            decisionStorage = new dslib.decisionStorage(self.policyFile);
            logger.log("Policy file loaded");
//          }
//          , function () {
//            logger.log("Policy file is not valid");
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
    var path = require('path');
    var existsSync = fs.existsSync || path.existsSync;
    if (!existsSync(policyFile)) {
      logger.log("No policy file found, copying default policy instead");
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

  policyManager.prototype.initialisePrompts = function(notificationManager) {
    var _self = this;
    this.notificationManager = notificationManager;

    // Register to receive notifications of prompt responses.
    this.notificationManager.on(this.notificationManager.notifyType.permissionResponse, promptResponse.bind(_self));
  }

  policyManager.prototype.getPolicyFilePath = function() {
    return this.policyFile;
  }
  policyManager.prototype.testRequest = function(request, cb){
    var result = {};
    if (!this.pmr) {
      logger.log("Invalid policy file: request denied");
      result["effect"] = false;
      cb(result);
      return;
    }
    var  path = {};
    var res = this.pmr.testRequest(request, path);
    result = path;
    result['effect'] = res;
    cb(result);
  }
  policyManager.prototype.enforceRequest = function(request, sessionId, noprompt, cb) {
    if (!this.pmr) {
      logger.log("Invalid policy file: request denied")
      cb(false);
      return;
    }

    var res = this.pmr.enforceRequest(request);

    if(res > 1 && res < 5 && decisionStorage && noprompt == false) {
      var storedDecision = decisionStorage.checkDecision(request, sessionId);
      if(storedDecision == 0 || storedDecision == 1) {
        cb(storedDecision);
      } else {
        this.notifyPermissionRequest(res, request, sessionId, cb);
      }
    } else {
      //logger.log("Policy Manager enforce request: "+JSON.stringify(request)+" - result is "+res);
      cb(res);
    }
  };

  policyManager.prototype.reloadPolicy = function () {
    //TODO: at the moment validation of root policy file fails
//    self.isAWellFormedPolicyFile(policyFile
//      , function () {
        this.pmr.reloadPolicy(self.genericURI);
//      }
//      , function () {
//        logger.log("Policy file is not valid");
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

  policyManager.prototype.notifyPermissionRequest = function(promptType, request, sessionId, cb) {
    var _self = this;

    // Add permission request to notifications list.
    var notification = this.notificationManager.addNotification(this.notificationManager.notifyType.permissionRequest, { promptType: promptType, request: request, sessionId: sessionId });

    // Store the callback with the notification id.
    this.promptCallbacks[notification.id] = {
      callback: cb,
      request: request,
      sessionId: sessionId
    };

    // Create a timeout - deny permission after 20 secs.
    setTimeout(function() {
      // Prompt has timed out - check that the user didn't respond in the meantime.
      if (_self.promptCallbacks.hasOwnProperty(notification.id)) {
        // Callback still exists => no user response received.
        var cb = _self.promptCallbacks[notification.id].callback;
        delete _self.promptCallbacks[notification.id];

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
    // Response from prompt received from user.
    var token = notify.data.responseTo;
    var reply = notify.data.response;

    // Get the original request notification.
    var requestNotification = this.notificationManager.getNotification(notify.data.responseTo);

    if (typeof requestNotification !== "undefined") {
      var request = requestNotification.data.request;
      var sessionId = requestNotification.data.sessionId;

      // Store the permission request response.
      var permit = storePermissionResponse(request, sessionId, reply);

      // Check if there's an outstanding callback (it may have timed out).
      if (this.promptCallbacks.hasOwnProperty(token)) {
        // Prompt still valid - get the details.
        var cb = this.promptCallbacks[token].callback;
        delete this.promptCallbacks[token];

        // Callback requires PERMIT == 0 and DENY == 1
        cb(permit === true ? 0 : 1);
      }
    } else {
      logger.error("Request notification missing for response " + token);
    }
  };

  exports.policyManager = policyManager;
  exports.updatePolicyVersion = pmrlib.updatePolicyVersion;
  exports.policyEvent = eventEmitter;

}());
