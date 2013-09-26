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
    var existsSync = fs.existsSync || path.existsSync;
    

    var policyGlobalVersionCounter = 0;
    var pip = {};

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


    var rootPm = function(rootPolicyFilename, info) {
        this.pmCore;
        this.pmNativeLib;
        this.rootPolicy;
        this.includedPolicyFiles;
        this.policyLocalVersionCounter = 0;

        this.rootPolicyFile = rootPolicyFilename;

        pip = info
        // Load the native module
        try {
            this.pmNativeLib = require('pm');
        } catch (err) {
            console.log("Warning! Policy manager could not be loaded");
        }

        loadIncludePolicy(this);
        loadPmCores(this);
    };


    function loadIncludePolicy(pmInstance) {
        //console.log('loadIncludePolicy');
        pmInstance.includedPolicyFiles = {};
        var data = String(fs.readFileSync(pmInstance.rootPolicyFile));
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
                pmInstance.rootPolicy = jsonData;
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
        var policyDir = path.dirname(pmInstance.rootPolicyFile);
        console.log('Policy dir is '+policyDir);
        while(index1 >= 0) {
            index1 = dtd.indexOf('<!ENTITY');
            index2 = dtd.indexOf('>');
            if(index1 >= 0) {
                var elems = dtd.substring(index1+8, index2).split(' ');
                //includedPolicyFiles[elems[1]] = policyDir+elems[3];
                pmInstance.includedPolicyFiles[elems[1]] = path.join(policyDir, elems[3]);
                dtd = dtd.substring(index2+1);
            }
        }
    }


    function loadPmCores(pmInstance) {
        pmInstance.pmCore = {};
        //Check if manufacturer file is defined and load pmCore
        if(pmInstance.includedPolicyFiles['manufacturer']) {
            //In case policy files do not exist, copy default ones
            //TODO: handle this in a better way...
            if(!existsSync(pmInstance.includedPolicyFiles['manufacturer'])) {
              fs.writeFileSync(pmInstance.includedPolicyFiles['manufacturer'], fs.readFileSync(path.resolve(path.join( __dirname , "..", "defaultmanpolicy.xml" ))));
            }
            loadPmCore(pmInstance, 'manufacturer', pmInstance.includedPolicyFiles['manufacturer']);
        }
        //Check if user file is defined and load pmCore
        if(pmInstance.includedPolicyFiles['user']) {
            //In case policy files do not exist, copy default ones
            //TODO: handle this in a better way...
            if(!existsSync(pmInstance.includedPolicyFiles['user'])) {
              fs.writeFileSync(pmInstance.includedPolicyFiles['user'], fs.readFileSync(path.resolve(path.join( __dirname , "..", "defaultpolicy.xml" ))));
            }
            loadPmCore(pmInstance, 'user', pmInstance.includedPolicyFiles['user']);
        }
    }


    function loadPmCore(pmInstance, type, filename) {
        console.log('loadPmCore - '+type+' - '+filename);
        //Check if policy file exists
        if(existsSync(filename)) {
            var crypto, dataHash, data = fs.readFileSync(filename);
            try { crypto = require("crypto"); } catch(e) { console.log ("Cannot load module 'crypto'"); }

            if(crypto) {
                dataHash = crypto.createHash("md5").update(data).digest("hex");
            }

            xmlParser.parseString(data, function (err, jsonData) {
                if (!err) {

                    var checkNeeded = true;
                    var policyWellFormatted = false;

                    if (existsSync(filename + ".md5")) {
                        if(fs.readFileSync(filename + ".md5") == dataHash) {
                            checkNeeded = false;
                            policyWellFormatted = true;
                            console.log("Policy schema already checked");
                        }
                    }
                    
                    if (checkNeeded) {
                        if(env.validate(jsonData, schema).errors.length === 0) {
                            if (crypto) {
                                fs.writeFileSync(filename + ".md5", dataHash);
                            }
                            policyWellFormatted = true;
                            console.log("Policy has a valid schema");
                        } else {
                            policyWellFormatted = false;
                            console.log('Policy file not valid: ' + filename);
                        }
                    }

                    if (policyWellFormatted) {
                        pmInstance.pmCore[type] = new pmInstance.pmNativeLib.PolicyManagerInt(filename, pip);
                    }
                }
            });
        }
        else {
            console.log('Policy file does not exist: '+filename);
        }
    }
    function testLoadIncludePolicy(pmInstance, mainPolicy) {
        console.log('loadIncludePolicy');
        pmInstance.includedPolicyFiles = {};
        console.log("ROOT POLICY FILE: "+mainPolicy);
        var data = String(fs.readFileSync(mainPolicy));
        var index = 0;
        while(index >= 0) {
            index = data.indexOf('&');
            if(index >= 0) {
                data = data.replace('&', '<extfile>');
                data = data.replace(';', '</extfile>');
            }
        }
        console.log("DATA: "+data);
        xmlParser.parseString(data, function (err, jsonData) {
            if (!err) {
                pmInstance.rootPolicy = jsonData;
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
        var policyDir = path.dirname(mainPolicy);
        console.log('Policy dir is '+policyDir);
        while(index1 >= 0) {
            index1 = dtd.indexOf('<!ENTITY');
            index2 = dtd.indexOf('>');
            //console.log("INDEX1: "+index1);
            if(index1 >= 0) {
                var elems = dtd.substring(index1+8, index2).split(' ');
                //pmInstance.includedPolicyFiles[elems[1]] = policyDir+elems[3];
                pmInstance.includedPolicyFiles[elems[1]] = path.join(policyDir, elems[3]);
                dtd = dtd.substring(index2+1);
            }
        }
    }
    
    rootPm.prototype.testRequest = function(request, path){
        var res = 1;
        if (!this.pmCore['user'] || !this.pmCore['manufacturer']) {
            var mainPolicy = this.rootPolicyFile.replace("policy.xml", "rootPolicy.xml");
            console.log(this.rootPolicyFile);
            testLoadIncludePolicy(this, mainPolicy);
            console.log(JSON.stringify(this.includedPolicyFiles));
            loadPmCores(this);
            console.log(JSON.stringify(this.pmCore));
            console.log(JSON.stringify(this.rootPolicy));
        }
        
        if(this.rootPolicy['policy-set']) {
            if (!request["environmentInfo"]) {
                request["environmentInfo"] = {};
            }
            var date = new Date();
            if (!request["environmentInfo"]["timemin"]) {
                request["environmentInfo"]["timemin"] = date.getHours()*60 + date.getMinutes();
            }
            if (!request["environmentInfo"]["days-of-week"]) {
                request["environmentInfo"]["days-of-week"] = 1 << date.getDay();
            
            }
            if (!request["environmentInfo"]["days-of-month"]) {
                request["environmentInfo"]["days-of-month"] = 1 << (date.getDate() - 1);
            }
            res = testPolicy(this, this.rootPolicy['policy-set'], request, path);
            
        }
        console.log(JSON.stringify(path));
        return res;
    }
    rootPm.prototype.enforceRequest = function(request) {
        if (policyGlobalVersionCounter != this.policyLocalVersionCounter){
            console.log("Policy Enforcement: Detected version mismatch (Global = " + 
                policyGlobalVersionCounter + " | Local = " + this.policyLocalVersionCounter+ ")" );

            this.reloadPolicy();
        }

        //console.log('\nrootPm - enforceRequest for '+JSON.stringify(request));
        var res = 1;
        if (!this.pmCore) {
            console.log("Invalid policy file: request denied")
            return 1;
        }
        if(this.rootPolicy['policy-set']) {
            var date = new Date();
            if (!request["environmentInfo"]) {
                request["environmentInfo"] = {};
            }
            request["environmentInfo"]["timemin"] = date.getHours()*60 + date.getMinutes();
            request["environmentInfo"]["days-of-week"] = 1 << date.getDay(); //dayToDaysOfWeek(date.getDay());
            request["environmentInfo"]["days-of-month"] = 1 << (date.getDate() - 1);
            res = evaluatePolicy(this, this.rootPolicy['policy-set'], request);
        }
        //Monday   0000001
        //Tuesday  0000010
        //Wednesday
        //Thursday
        //Friday
        //Saturday
        //Sunday 1000000

        //console.log('rootPm - enforceRequest returning '+res);
        return (res);
    };

    function testPolicy(pmInstance, policy, request, path) {
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
                    path['combine'] = 'deny-overrides';
                    combAlg = 0;
                    break;
                case 'Deny-unless-permit-or-prompt':
                    path['combine'] = 'deny-unless-permit-or-prompt';
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
                    console.log("POLICY: "+policy['policy-set'][j]);
                    resTmp = testPolicy(pmInstance, policy['policy-set'][j], request, path);
                    res = LUTs[combAlg][res][resTmp];
                }
            }
            //Evaluate external files
            if(policy['extfile']) {
                for(var j in policy['extfile']) {
                    console.log(policy['extfile'][j]);
                    if(policy['extfile'][j] == 'app') {
                        //init return value to inapplicable in case app policy is missing
                        resTmp = 6;
                        //If app id is specified then check app policy file
                        if(request.widgetInfo && request.widgetInfo.id) {
                            //If pmCore to handle app file is missing, then instance it
                            if(!pmInstance.pmCore[request.widgetInfo.id]) {
                                var parts = pmInstance.includedPolicyFiles['app'].split('.');
                                var appFilename = parts[0];
                                for(var i=1; i<parts.length-1; i++) {
                                    appFilename += '.'+parts[i];
                                }
                                appFilename += '_'+request.widgetInfo.id+'.'+parts[parts.length-1];
                                console.log('app filename is '+appFilename);
                                loadPmCore(pmInstance, request.widgetInfo.id, appFilename);
                            }
                            if(pmInstance.pmCore[request.widgetInfo.id]) {
                                path['app'] = {};
                                path['app']['id'] = request.widgetInfo.id;
                                resTmp = pmInstance.pmCore[request.widgetInfo.id].enforceRequest(request, path['app']);
                                path['app']['effect'] = resTmp;
                                console.log("TEST REQUEST PATH"+ JSON.stringify(path));
                            }
                        }
                        //console.log('pm for app returned '+resTmp);
                    }
                    else {
                        if(pmInstance.pmCore[policy['extfile'][j]]) {
                            if (!path) {
                                path = {};
                            }
                            path[policy['extfile'][j]] = {};
                            resTmp = pmInstance.pmCore[policy['extfile'][j]].enforceRequest(request,path[policy['extfile'][j]] );
                            path[policy['extfile'][j]]['effect'] = resTmp;
                            console.log("TEST REQUEST PATH"+ JSON.stringify(path));
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
    
    function evaluatePolicy(pmInstance, policy, request) {
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
                    resTmp = evaluatePolicy(pmInstance, policy['policy-set'][j], request);
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
                            if(!pmInstance.pmCore[request.widgetInfo.id]) {
                                var parts = pmInstance.includedPolicyFiles['app'].split('.');
                                var appFilename = parts[0];
                                for(var i=1; i<parts.length-1; i++) {
                                    appFilename += '.'+parts[i];
                                }
                                appFilename += '_'+request.widgetInfo.id+'.'+parts[parts.length-1];
                                console.log('app filename is '+appFilename);
                                loadPmCore(pmInstance, request.widgetInfo.id, appFilename);
                            }
                            if(pmInstance.pmCore[request.widgetInfo.id]) {
                                resTmp = pmInstance.pmCore[request.widgetInfo.id].enforceRequest(request);
                            }
                        }
                        //console.log('pm for app returned '+resTmp);
                    }
                    else {
                        if(pmInstance.pmCore[policy['extfile'][j]]) {
                            resTmp = pmInstance.pmCore[policy['extfile'][j]].enforceRequest(request);
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

    function updatePolicyVersion() {
        policyGlobalVersionCounter++;
        console.log("policyGlobalVersionCounter set to " + policyGlobalVersionCounter);
    };

    rootPm.prototype.reloadPolicy = function (genericURI) {
        if (genericURI){
            pip = genericURI;
        }
        loadIncludePolicy(this);
        loadPmCores(this);
        console.log("Policy version was " + this.policyLocalVersionCounter);
        this.policyLocalVersionCounter = policyGlobalVersionCounter;
        console.log("Policy updated version was " + this.policyLocalVersionCounter);
    };

    exports.rootPm = rootPm;
    exports.updatePolicyVersion = updatePolicyVersion;
}());
