var request = require("http"); 

var pmlib; 
var fs = require("fs"); 
var pm ; 
var userPolicyFile = "./policy.xml"; 
var rootPolicyFile = "./rootPolicy.xml";
					   
//	"http://webinos.org/api/discovery",
//	"http://webinos.org/api/w3c/geolocation",
//	"http://webinos.org/api/messaging",
//	"http://webinos.org/api/messaging.find",
//	"http://webinos.org/api/messaging.send",
//	"http://webinos.org/api/messaging.subscribe",
//	"http://webinos.org/api/nfc",
//	"http://webinos.org/api/nfc.read"

// currently not testing purpose or obligation
// System default is to convert a PERMIT to BLANKER
var tests = [
//  [testName,  expected-result, policy-file, userId, certCn, feature, deviceId, purpose, obligations]
	
//	["Test Allow All 1", 4, "policy-allow-all.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],               // PERMIT -> BLANKET PROMPT
//	["Test Allow All 2", 4, "policy-allow-all.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],               // PERMIT -> BLANKET PROMPT
	
//	["Test First Applicable 1", 4, "policy-first-1.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],          // PERMIT -> BLANKET PROMPT
//	["Test First Applicable 2", 6, "policy-first-1.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],          // INAPPLICABLE
//	["Test First Applicable 3", 1, "policy-first-2.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],          // DENY
//	["Test First Applicable 4", 6, "policy-first-2.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],          // INAPPLICABLE  
	
//	["Test Permit Overrides 1", 4, "policy-permit-1.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],         // PERMIT -> BLANKET PROMPT
//	["Test Permit Overrides 2", 1, "policy-permit-1.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],         // DENY
	
//	["Test Deny Overrides 1", 1, "policy-deny-1.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],             // DENY
//	["Test Deny Overrides 2", 4, "policy-deny-1.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],              // PERMIT -> BLANKET PROMPT
	
//	["Test Permit Overrides Prompt 1", 2, "policy-permit-prompt.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"] ,  //  PROMPT_ONESHOT
//	["Test Deny Overrides Prompt 1", 4, "policy-deny-prompt.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],  // PROMPT_BLANKET
	
//	["Test Locic 1", 6, "policy-logic-1.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Locic 2", 6, "policy-logic-1.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 3", 4, "policy-logic-1.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
	
//	["Test Locic 4", 6, "policy-logic-3.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Locic 5", 6, "policy-logic-3.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 6", 4, "policy-logic-3.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
	
//	["Test Locic 7", 6, "policy-logic-4.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Locic 8", 6, "policy-logic-4.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 9", 4, "policy-logic-4.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
	
//	["Test Locic 10", 6, "policy-logic-5.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Locic 11", 6, "policy-logic-5.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 12", 4, "policy-logic-5.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
		
//	["Test Locic 13", 6, "policy-logic-6.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Locic 14", 6, "policy-logic-6.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 15", 6, "policy-logic-6.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
		
//	["Test Locic 16", 6, "policy-logic-7.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Locic 17", 6, "policy-logic-7.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 18", 6, "policy-logic-7.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
		
//	["Test Locic 19", 6, "policy-logic-8.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 20", 6, "policy-logic-8.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 21", 6, "policy-logic-8.xml", "user3", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
		
//	["Test Locic 22", 4, "policy-logic-9.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 23", 4, "policy-logic-9.xml", "user2", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
//	["Test Locic 24", 6, "policy-logic-9.xml", "user3", "cert1", "http://webinos.org/api/w3c/geolocation", "device2"],
	
//	["Test Manufacturer 1", 4, "policy-manufacturer-1.xml", "user1", "cert1", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Manufacturer 2", 1, "policy-manufacturer-1.xml", "user1", "cert2", "http://mega.org/api/secret1", "device1"],
//	["Test Manufacturer 3", 4, "policy-manufacturer-1.xml", "user1", "cert2", "http://mega.org/api/open1", "device1"],
//	["Test Manufacturer 4", 1, "policy-manufacturer-1.xml", "user2", "cert2", "http://mega.org/api/open1", "device1"],
//	["Test Manufacturer 5", 6, "policy-manufacturer-1.xml", "user3", "cert2", "http://mega.org/api/open1", "device1"],
//	["Test Manufacturer 6", 4, "policy-manufacturer-1.xml", "user3", "cert2", "http://webinos.org/api/w3c/geolocation", "device1"],
//	["Test Manufacturer 7", 4, "policy-manufacturer-1.xml", "user2", "cert2", "http://webinos.org/api/messaging.send", "device3"],
//  ["Test Manufacturer 8", 4, "policy-manufacturer-1.xml", "user3", "cert2", "http://webinos.org/api/w3c/geolocation", "device2"],
//    ["Test Manufacturer 9", 4, "policy-manufacturer-1.xml", "user2", "cert2", "http://webinos.org/api/w3c/geolocation", "device2"] ,

//	["Test Manufacturer 10", 6, "policy-manufacturer-1.xml", "user4", "cert2", "http://webinos.org/api/w3c/geolocation", "device2"]//,
//	["SimpleTest 1", 1, "policy-simple-1.xml", "user1", "cert2", "http://mega.org/api/secret1", "device1"],
//	["SimpleTest 2", 1, "policy-simple-2.xml", "user1", "cert2", "http://mega.org/api/secret1", "device1"],
//	["SimpleTest 2a", 1, "policy-simple-2.xml", "user1", "cert2", "http://mega.org/api/secret1", "device2"],
//	["SimpleTest 3", 1, "policy-simple-3.xml", "user1", "cert2", "http://mega.org/api/secret1", "device1"],
//	["SimpleTest 3a", 1, "policy-simple-3.xml", "user1", "cert2", "http://mega.org/api/secret1", "device2"],
	["SimpleTest 4", 1, "policy-simple-4.xml", "user1", "cert2", "http://mega.org/api/secret1", "device1"],
	["SimpleTest 4a", 1, "policy-simple-4.xml", "user1", "cert2", "http://mega.org/api/secret1", "device2"],
	["SimpleTest 5", 4, "policy-simple-5.xml", "user3", "cert3", "http://mega.org/api/secret3", "device2"],

	["ScaleTest 1a", 4, "policy-scale-1a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 2a", 4, "policy-scale-2a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 3a", 4, "policy-scale-3a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 4a", 4, "policy-scale-4a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 5a", 4, "policy-scale-5a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 6a", 1, "policy-scale-6a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 7a", 4, "policy-scale-7a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 8a", 4, "policy-scale-8a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 9a", 1, "policy-scale-9a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 10a", 1, "policy-scale-10a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 11a", 1, "policy-scale-11a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 1", 1, "policy-scale-1.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 2", 1, "policy-scale-2.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 3", 1, "policy-scale-3.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 4", 1, "policy-scale-4.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 5", 1, "policy-scale-5.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 6", 4, "policy-scale-6.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
//	["ScaleTest 6a", 6, "policy-scale-6.xml", "user2", "cert2", "http://mega.org/api/secret2", "device2"],
	["ScaleTest 6b", 6, "policy-scale-6.xml", "user3", "cert3", "http://mega.org/api/secret3", "device3"]//,

		
	];


function loadManager() {
	pmlib = require("../../lib/policymanager.js");
	pm = new pmlib.policyManager(rootPolicyFile);
	return pm;
}


function changepolicy(fileName) {
	console.log("Change policy to file "+fileName);
	var data = fs.readFileSync("./"+fileName);
	fs.writeFileSync(userPolicyFile, data);
}


function setRequest(userId, certCn, feature, deviceId, purpose, obligations) {
	console.log("Creating a request for: user "+userId+", device "+deviceId+", application released by "+certCn+", feature "+feature+", purpose "+purpose+" and obligations "+obligations);
	var req = {};
	var ri = {};
	var si = {};
	var wi = {};
	var di = {};
	si.userId = userId;
	req.subjectInfo = si;
	wi.distributorKeyCn = certCn;
    req.widgetInfo = wi;
	di.requestorId = deviceId;
    req.deviceInfo = di;
	ri.apiFeature = feature;
	req.resourceInfo = ri;
	if (purpose !== undefined)
		req.purpose = purpose;
	if (obligations !== undefined)
		req.obligations=obligations;
	return req;
}

var TestWrapper = function() {
    this.complete = false; 
    this.result = -1; 
}


Date.prototype.timeNow = function(){
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds() + "." + this.getMilliseconds();
};


function timeDiff(startDate, endDate){
    var startTime = startDate.timeNow();
    var sSec = startDate.getSeconds(); 
    var sMil = startDate.getMilliseconds();
	var endTime = endDate.timeNow();
	var eSec = endDate.getSeconds(); 
    var eMil = endDate.getMilliseconds();

    m1 = 0; 
    if (eSec < sSec)
		m1 = (60 + (eSec - sSec)) * 1000; 
	else 
		m1 = (eSec - sSec) * 1000; 

	
	    m2 = m1 + (eMil - sMil); 

	console.log("\n>>>> Time to Access Control Request = " + startTime + " -- " + endTime + " -- " + m2 + "\n" ); 

 
    
}

function checkFeature(policyName, userName, certName, featureName, deviceId, purpose, obligations) {
	console.log(); 

var newStartDate = new Date();

 


 
	changepolicy(policyName);

	pm = loadManager();

	var req = setRequest(userName, certName, featureName, deviceId, purpose, obligations);

	var testWrap = new TestWrapper(); 
// noprompt (third parameter) set to true
//	var res = pm.enforceRequest(req, 0, true);
//	console.log("result is "+ res + " (" + effTxt[res] +  ")");
//	console.log(); 
//	return res;

	pm.enforceRequest(req, 0, true, function(res){
		console.log("result is: " + res);
		testWrap.result = res; 
		testWrap.complete = true; 
	}); 

	var newEndDate = new Date();
	timeDiff(newStartDate, newEndDate);

	return testWrap; 

}


//enum Effect {PERMIT, DENY, PROMPT_ONESHOT, PROMPT_SESSION, PROMPT_BLANKET, UNDETERMINED, INAPPLICABLE};
//               0       1         2               3               4              5             6

var effTxt = new Array("PERMIT", "DENY", "PROMPT_ONESHOT", "PROMPT_SESSION", 
					   "PROMPT_BLANKET", "UNDETERMINED", "INAPPLICABLE");


describe("Manager.PolicyManager", function() {

    for(var testidx = 0; testidx < tests.length; testidx++){
	       
	    (function(idx) {
	        it(tests[idx][0], function() {
	            runs(function(){
	                console.log("\nTest (" + idx +  "): " + tests[idx][0]  + "\n");
	                var expected =  tests[idx][1];
		            var policyToTest = tests[idx][2];
        	        var userName = tests[idx][3];
                    var certName = tests[idx][4];
				    var featureName = tests[idx][5];
				    var deviceId = tests[idx][6];
				    var purpose = tests[idx][7];
				    var obligations = tests[idx][8];
				       
				       
	                var res = checkFeature(policyToTest, userName, certName, featureName, deviceId);
				    
				    //console.log("Policy " + policyToTest);	
				    if(	res.result == expected){
				    	console.log(policyToTest + "  result: " + effTxt[res.result] + " - " + effTxt[expected] + " :expected    -- OK" ); 
				    } 
				    else{
				    	console.log(">>> ERROR <<<  " + policyToTest + "  result: " + effTxt[res.result] + " - " + effTxt[expected] + " :expected    -- FAILED" );  	
				    }
				    expect(res.result).toEqual(expected);
				});   //runs
	        });       //it
	    })(testidx);  // function(idx)
	  };
	
});
