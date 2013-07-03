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
 * Copyright 2013 Telecom Italia SpA
 * 
 ******************************************************************************/


(function () {
    "use strict";

    var fs = require('fs');
    var path = require("path");
    var xml2js = require('xml2js');
    var xmlParser = new xml2js.Parser(xml2js.defaults['0.2']);
    var JSV = require('JSV').JSV;
    var env = JSV.createEnvironment("json-schema-draft-03");
    var schema = require('./schema.json');

    var pmCore = null;
    var pmNativeLib = null;
    var rootPolicy = null;
    var rootPolicyFile = null;
    var includedPolicyFiles = null;

    // LUT for deny-overrides algorithm
    var LUT_do = [
        [0, 1, 2, 3, 4, 5, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [2, 1, 2, 2, 2, 5, 2],
        [3, 1, 2, 3, 3, 5, 3],
        [4, 1, 2, 3, 4, 5, 4],
        [5, 5, 5, 5, 5, 5, 5],
        [0, 1, 2, 3, 4, 5, 6],
        ];

    // LUT for deny-unless-permit-or-promp algorithm
    var LUT_dupop = [
        [0, 1, 2, 3, 4, 1, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [2, 1, 2, 2, 2, 1, 2],
        [3, 1, 2, 3, 3, 1, 3],
        [4, 1, 2, 3, 4, 1, 4],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 1, 2, 3, 4, 1, 6],
        ];

    var LUTs = [LUT_do, LUT_dupop];


    var rootPm = function(rootPolicyFilename) {
        var self = this;
        //console.log('rootPm - policy is '+rootPolicyFilename);
        // Load the native module
        try {
            pmNativeLib = require('pm');
        } catch (err) {
            console.log("Warning! Policy manager could not be loaded");
        }
        //Policy file location
        rootPolicyFile = rootPolicyFilename;
        loadIncludePolicy();
        loadPmCores();
    };


    function loadIncludePolicy() {
        //console.log('loadIncludePolicy');
        includedPolicyFiles = {};
        var data = String(fs.readFileSync(rootPolicyFile));
        var index = 0;
        while(index >= 0) {
            index = data.indexOf('&');
            if(index >= 0) {
                data = data.replace('&', '<extfile>');
                data = data.replace(';', '</extfile>');
            }
        }
        xmlParser.parseString(data, function (err, jsonData) {
            if (!err) {
                rootPolicy = jsonData;
            } else {
                //TODO Handle errors
                console.log('Root policy file parse error: '+err);
                return;
            }
        });

        //Dtd analisys
        var index1, index2;
        index1 = data.indexOf('[');
        index2 = data.indexOf(']');
        var dtd = data.substring(index1+1, index2);
        index1 = 0;
        var policyDir = path.dirname(rootPolicyFile);
        console.log('Policy dir is '+policyDir);
        while(index1 >= 0) {
            index1 = dtd.indexOf('<!ENTITY');
            index2 = dtd.indexOf('>');
            if(index1 >= 0) {
                var elems = dtd.substring(index1+8, index2).split(' ');
                //includedPolicyFiles[elems[1]] = policyDir+elems[3];
                includedPolicyFiles[elems[1]] = path.join(policyDir, elems[3]);
                dtd = dtd.substring(index2+1);
            }
        }
    }


    function loadPmCores() {
        pmCore = {};
        //Check if manufacturer file is defined and load pmCore
        if(includedPolicyFiles['manufacturer']) {
            //In case policy files do not exist, copy default ones
            //TODO: handle this in a better way...
            if(!fs.existsSync(includedPolicyFiles['manufacturer'])) {
              fs.writeFileSync(includedPolicyFiles['manufacturer'], fs.readFileSync(path.resolve(path.join( __dirname , "..", "defaultmanpolicy.xml" ))));
            }
            loadPmCore('manufacturer', includedPolicyFiles['manufacturer']);
        }
        //Check if user file is defined and load pmCore
        if(includedPolicyFiles['user']) {
            //In case policy files do not exist, copy default ones
            //TODO: handle this in a better way...
            if(!fs.existsSync(includedPolicyFiles['user'])) {
              fs.writeFileSync(includedPolicyFiles['user'], fs.readFileSync(path.resolve(path.join( __dirname , "..", "defaultpolicy.xml" ))));
            }
            loadPmCore('user', includedPolicyFiles['user']);
        }
    }


    function loadPmCore(type, filename) {
        console.log('loadPmCore - '+type+' - '+filename);
        //Check if policy file exists
        if(fs.existsSync(filename)) {
            var data = fs.readFileSync(filename);
            xmlParser.parseString(data, function (err, jsonData) {
                if (!err) {
                    //Validate policy file
                    if(env.validate(jsonData, schema).errors.length === 0) {
                        pmCore[type] = new pmNativeLib.PolicyManagerInt(filename);
                    }
                    else {
                        console.log('Policy file not valid: '+filename);
                    }
                }
            });
        }
        else {
            console.log('Policy file does not exist: '+filename);
        }
    }


    rootPm.prototype.enforceRequest = function(request) {
        //console.log('\nrootPm - enforceRequest for '+JSON.stringify(request));
        var res = 1;
        if (!pmCore) {
            console.log("Invalid policy file: request denied")
            return 1;
        }
        if(rootPolicy['policy-set']) {
            res = evaluatePolicy(rootPolicy['policy-set'], request);
        }
        //console.log('rootPm - enforceRequest returning '+res);
        return (res);
    };


    function evaluatePolicy(policy, request) {
        // Values returned by policy manager:
        // PERMIT = 0
        // DENY = 1
        // PROMPT_ONESHOT = 2
        // PROMPT_SESSION = 3
        // PROMPT_BLANKET = 4
        // UNDETERMINED = 5
        // INAPPLICABLE = 6
        var res = 6;
        var combAlg = -1;
        if(policy['$'] && policy['$']['combining-algorithm']) {
            switch(policy['$']['combining-algorithm']) {
                case 'Deny-overrides':
                    combAlg = 0;
                    break;
                case 'Deny-unless-permit-or-prompt':
                    combAlg = 1;
                    break;
                default:
                    combAlg = -1;
                    break;
            }
        }
        if(combAlg >= 0) {
            var resTmp;
            //Evaluate policy-set
            if(policy['policy-set']) {
                for(var j in policy['policy-set']) {
                    resTmp = evaluatePolicy(policy['policy-set'][j], request);
                    res = LUTs[combAlg][res][resTmp];
                }
            }
            //Evaluate external files
            if(policy['extfile']) {
                for(var j in policy['extfile']) {
                    if(policy['extfile'][j] == 'app') {
                        //init return value to inapplicable in case app policy is missing
                        resTmp = 6;
                        //If app id is specified then check app policy file
                        if(request.widgetInfo && request.widgetInfo.id) {
                            //If pmCore to handle app file is missing, then instance it
                            if(!pmCore[request.widgetInfo.id]) {
                                var parts = includedPolicyFiles['app'].split('.');
                                var appFilename = parts[0];
                                for(var i=1; i<parts.length-1; i++) {
                                    appFilename += '.'+parts[i];
                                }
                                appFilename += '_'+request.widgetInfo.id+'.'+parts[parts.length-1];
                                console.log('app filename is '+appFilename);
                                loadPmCore(request.widgetInfo.id, appFilename);
                            }
                            if(pmCore[request.widgetInfo.id]) {
                                resTmp = pmCore[request.widgetInfo.id].enforceRequest(request);
                            }
                        }
                        //console.log('pm for app returned '+resTmp);
                    }
                    else {
                        if(pmCore[policy['extfile'][j]]) {
                            resTmp = pmCore[policy['extfile'][j]].enforceRequest(request);
                            //console.log('pm for '+policy['extfile'][j]+' returned '+resTmp);
                        }
                    }
                    res = LUTs[combAlg][res][resTmp];
                }
            }
        }
        //If algorithm is Deny-unless-permit-or-prompt and result is inapplicable
        // or undetermined, then turn it to deny
        if(combAlg == 1 && res > 4) {
            res = 1;
        }
        //console.log('evaluatePolicy returning '+res);
        return(res);
    }


    rootPm.prototype.reloadPolicy = function () {
        loadIncludePolicy();
        loadPmCores();
    };


    exports.rootPm = rootPm;

}());
