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
    function testLoadIncludePolicy(mainPolicy) {
        console.log('loadIncludePolicy');
        includedPolicyFiles = {};
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
        var policyDir = path.dirname(mainPolicy);
        console.log('Policy dir is '+policyDir);
        while(index1 >= 0) {
            index1 = dtd.indexOf('<!ENTITY');
            index2 = dtd.indexOf('>');
            console.log("INDEX1: "+index1);
            if(index1 >= 0) {
                var elems = dtd.substring(index1+8, index2).split(' ');
                //includedPolicyFiles[elems[1]] = policyDir+elems[3];
                includedPolicyFiles[elems[1]] = path.join(policyDir, elems[3]);
                dtd = dtd.substring(index2+1);
            }
        }
    }
    
    rootPm.prototype.testRequest = function(request, path){
        var res = 1;
        if (!pmCore['user'] || !pmCore['manufacturer']) {
            var mainPolicy = rootPolicyFile.replace("policy.xml", "rootPolicy.xml");
            console.log(rootPolicyFile);
            testLoadIncludePolicy(mainPolicy);
            console.log(JSON.stringify(includedPolicyFiles));
            loadPmCores();
            console.log(JSON.stringify(pmCore));
            console.log(JSON.stringify(rootPolicy));
        }
        
        if(rootPolicy['policy-set']) {
            if (!request["environmentInfo"]) {
                request["environmentInfo"] = {};
            }
            var date = new Date();
            if (!request["environmentInfo"]["timemin"]) {
                request["environmentInfo"]["timemin"] = date.getHours()*60 + date.getMinutes();
            }
            if (!request["environmentInfo"]["days-of-week"]) {
                request["environmentInfo"]["days-of-week"] = 1 << date.getDay(); //dayToDaysOfWeek(date.getDay());
            
            }
            if (!request["environmentInfo"]["days-of-month"]) {
                request["environmentInfo"]["days-of-month"] = 1 << (date.getDate() - 1);
            }
            res = testPolicy(rootPolicy['policy-set'], request, path);
            
        }
        console.log(JSON.stringify(path));
        return res;
    }
    rootPm.prototype.enforceRequest = function(request) {
        //console.log('\nrootPm - enforceRequest for '+JSON.stringify(request));
        var res = 1;
        if (!pmCore) {
            console.log("Invalid policy file: request denied")
            return 1;
        }
        if(rootPolicy['policy-set']) {
            var date = new Date();
            if (!request["environmentInfo"]) {
                request["environmentInfo"] = {};
            }
            request["environmentInfo"]["timemin"] = date.getHours()*60 + date.getMinutes();
            request["environmentInfo"]["days-of-week"] = 1 << date.getDay(); //dayToDaysOfWeek(date.getDay());
            request["environmentInfo"]["days-of-month"] = 1 << (date.getDate() - 1);
            res = evaluatePolicy(rootPolicy['policy-set'], request);
        }
        //Monday   0000001
        //Tuesday  0000010
        //Wednesday
        //Thursday
        //Friday
        //Saturday
        //DOMENICA 1000000
        //console.log('rootPm - enforceRequest returning '+res);
        return (res);
    };

    function testPolicy(policy, request, path) {
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
                    resTmp = testPolicy(policy['policy-set'][j], request, path);
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
                                path['app'] = {};
                                path['app']['id'] = request.widgetInfo.id;
                                resTmp = pmCore[request.widgetInfo.id].enforceRequest(request, path['app']);
                                path['app']['effect'] = resTmp;
                                console.log("TEST REQUEST PATH"+ JSON.stringify(path));
                            }
                        }
                        //console.log('pm for app returned '+resTmp);
                    }
                    else {
                        if(pmCore[policy['extfile'][j]]) {
                            if (!path) {
                                path = {};
                            }
                            path[policy['extfile'][j]] = {};
                            resTmp = pmCore[policy['extfile'][j]].enforceRequest(request,path[policy['extfile'][j]] );
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
    /*
    function dayToDaysOfWeek(day) {
        switch (day) {
            case 0:
                return 1;
            case 1:
                return 64;
            case 2:
                return 32;
            case 3:
                return 16;
            case 4:
                return 8;
            case 5:
                return 4;
            case 6:
                return 2;
            default:
                return 0;
        }
    }
    function dayToDaysOfMonth(day) {
        switch (day) {
            case 1:
                return 1073741824;
            case 2:
                return 536870912;
            case 3:
                return 268435456;
            case 4:
                return 134217728;
            case 5:
                return 67108864;
            case 6:
                return 33554432;
            case 7:
                return 16777216;
            case 8:
                return 8388608;
            case 9:
                return 4194304;
            case 10:
                return 2097152;
            case 11:
                return 1048576;
            case 12:
                return 524288;
            case 13:
                return 262144;
            case 14:
                return 131072;
            case 15:
                return 65536;
            case 16:
                return 32768;
            case 17:
                return 16384;
            case 18:
                return 8192;
            case 19:
                return 4096;
            case 20:
                return 2048;
            case 21:
                return 1024;
            case 22:
                return 512;
            case 23:
                return 256;
            case 24:
                return 128;
            case 25:
                return 64;
            case 26:
                return 32;
            case 27:
                return 16;
            case 28:
                return 8;
            case 29:
                return 4;
            case 30:
                return 2;
            case 31:
                return 1;
            default:
                return 0;                
        }
    }
*/
    exports.rootPm = rootPm;

}());
