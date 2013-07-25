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
* Copyright 2012 Telecom Italia Spa
*******************************************************************************/

var pmlib;
var fs = require("fs");
var path = require("path");
var pm;
var userPolicyFile = "./policy.xml";
var rootPolicyFile = './rootPolicy.xml';

var featureList = [
	"http://webinos.org/api/mediacontent",
    "http://webinos.org/api/w3c/geolocation",
	"http://webinos.org/api/deviceinteraction",
	"http://webinos.org/api/w3c/webrtc"
	];

var userList = [
	"helen_jennings@pzh.webinos.org",
	"peter_jones@pzh.webinos.org"
	];

var deviceList = [
    "PeteriPad",
    "PeterTV",
    "HelenGalaxyNote",
    "HeleniPhone",
    "HeleniMac"
	];

var policyList = [
    "HelenGalaxyNote.xml",
    "HeleniMac.xml",
    "PeterTV.xml"
	];

var environments = [
    "Helen Family",
    "Helen Travel",
    "Peter Home"
    ];

function loadManager() {
	pmlib = require(path.join(__dirname, "../../lib/policymanager.js"));
	pm = new pmlib.policyManager(path.join(__dirname, rootPolicyFile));
	return pm;
}


function changepolicy(fileName) {
	console.log("Change policy to file "+fileName);
	var data = fs.readFileSync(path.join(__dirname, fileName));
	fs.writeFileSync(path.join(__dirname, userPolicyFile), data);
}


function setRequest(userId, feature, deviceId, purpose, obligations, environment) {
	console.log("Setting request for user "+userId+", device "+deviceId+
        ", feature "+feature+", purpose "+purpose+", obligations "+obligations+
        " and environment "+environment);
	var req = {};
	var ri = {};
	var si = {};
	var di = {};
	si.userId = userId;
	req.subjectInfo = si;
	di.requestorId = deviceId;
        req.deviceInfo = di;
	ri.apiFeature = feature;
	req.resourceInfo = ri;
	if (purpose)
		req.purpose = purpose;
	if (obligations)
		req.obligations=obligations;
	if (environment) {
        req.environmentInfo = {};
        req.environmentInfo.profile = environment;
    }
	return req;
}

var TestWrapper = function () {
  this.complete = false;
  this.result = -1;
};

function checkFeature(policyName, userName, featureName, deviceId, purpose, obligations, environment) {
	changepolicy(policyName);
	pm = loadManager();

	var req = setRequest(userName, featureName, deviceId, purpose, obligations, environment);

  var testWrap = new TestWrapper();

	// noprompt (third parameter) set to true
	pm.enforceRequest(req, 0, true, function(res) {
    console.log("result is: " + res);
    testWrap.result = res;
    testWrap.complete = true;
  });

  return testWrap;
}

describe("Manager.PolicyManager", function() {

    var purpose = [
        true,	//"http://www.w3.org/2002/01/P3Pv1/current"
        false,	//"http://www.w3.org/2002/01/P3Pv1/admin"
        false,	//"http://www.w3.org/2002/01/P3Pv1/develop"
        false,	//"http://www.w3.org/2002/01/P3Pv1/tailoring"
        false,	//"http://www.w3.org/2002/01/P3Pv1/pseudo-analysis"
        false,	//"http://www.w3.org/2002/01/P3Pv1/pseudo-decision"
        false,	//"http://www.w3.org/2002/01/P3Pv1/individual-analysis"
        false,	//"http://www.w3.org/2002/01/P3Pv1/individual-decision"
        false,	//"http://www.w3.org/2002/01/P3Pv1/contact"
        false,	//"http://www.w3.org/2002/01/P3Pv1/historical"
        false,	//"http://www.w3.org/2002/01/P3Pv1/telemarketing"
        false,	//"http://www.w3.org/2002/01/P3Pv11/account"
        false,	//"http://www.w3.org/2002/01/P3Pv11/arts"
        false,	//"http://www.w3.org/2002/01/P3Pv11/browsing"
        false,	//"http://www.w3.org/2002/01/P3Pv11/charity"
        false,	//"http://www.w3.org/2002/01/P3Pv11/communicate"
        false,	//"http://www.w3.org/2002/01/P3Pv11/custom"
        false,	//"http://www.w3.org/2002/01/P3Pv11/delivery"
        false,	//"http://www.w3.org/2002/01/P3Pv11/downloads"
        false,	//"http://www.w3.org/2002/01/P3Pv11/education"
        false,	//"http://www.w3.org/2002/01/P3Pv11/feedback"
        false,	//"http://www.w3.org/2002/01/P3Pv11/finmgt"
        false,	//"http://www.w3.org/2002/01/P3Pv11/gambling"
        false,	//"http://www.w3.org/2002/01/P3Pv11/gaming"
        false,	//"http://www.w3.org/2002/01/P3Pv11/government"
        false,	//"http://www.w3.org/2002/01/P3Pv11/health"
        false,	//"http://www.w3.org/2002/01/P3Pv11/login"
        false,	//"http://www.w3.org/2002/01/P3Pv11/marketing"
        false,	//"http://www.w3.org/2002/01/P3Pv11/news"
        false,	//"http://www.w3.org/2002/01/P3Pv11/payment"
        false,	//"http://www.w3.org/2002/01/P3Pv11/sales"
        false,	//"http://www.w3.org/2002/01/P3Pv11/search"
        false,	//"http://www.w3.org/2002/01/P3Pv11/state"
        false,	//"http://www.w3.org/2002/01/P3Pv11/surveys"
        false	//"http://www.primelife.eu/purposes/unspecified"
        ];

    it("1. Pre-journey", function() {
		runs(function() {
			var res = checkFeature(policyList[1], userList[0], featureList[0], deviceList[3], purpose, null, environments[0]);
			expect(res.result).toEqual(0);
		});
	});

	it("2. Stuck in traffic", function() {
		runs(function() {
			var res = checkFeature(policyList[0], userList[1], featureList[1], deviceList[0], purpose, null, environments[1]);
			expect(res.result).toEqual(1);
		});
	});

	it("3.1. Service station", function() {
		runs(function() {
			var res = checkFeature(policyList[0], userList[1], featureList[3], deviceList[1], purpose, null, environments[1]);
			expect(res.result).toEqual(0);
		});
	});

	it("3.2. Service station", function() {
		runs(function() {
			var res = checkFeature(policyList[2], userList[0], featureList[3], deviceList[2], purpose, null, environments[2]);
			expect(res.result).toEqual(0);
		});
	});

	it("4. Motorway", function() {
		runs(function() {
			var res = checkFeature(policyList[0], userList[1], featureList[2], deviceList[0], purpose, null, environments[1]);
			expect(res.result).toEqual(0);
		});
	});

	it("5.1. Country lane", function() {
		runs(function() {
			var res = checkFeature(policyList[1], userList[1], featureList[0], deviceList[0], purpose, null, environments[1]);
			expect(res.result).toEqual(1);
		});
	});

	it("5.2. Country lane", function() {
		runs(function() {
			var res = checkFeature(policyList[2], userList[0], featureList[0], deviceList[2], purpose, null, environments[2]);
			expect(res.result).toEqual(0);
		});
	});

});

