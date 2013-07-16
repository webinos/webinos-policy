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
// System default is to convert a PERMIT to BLANKET PROMPT
var tests = [
//  [testName,  expected-result, policy-file, userId, certCn, feature, deviceId, purpose, obligations]

	["ScaleTest 1a", 4, "policy-scale-1a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 2a", 4, "policy-scale-2a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 3a", 4, "policy-scale-3a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 4a", 4, "policy-scale-4a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 5a", 4, "policy-scale-5a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 6a", 1, "policy-scale-6a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 7a", 4, "policy-scale-7a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 8a", 4, "policy-scale-8a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 9a", 4, "policy-scale-9a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 10a", 1, "policy-scale-10a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 11a", 1, "policy-scale-11a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],  
    ["ScaleTest 12a", 1, "policy-scale-12a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
    ["ScaleTest 13a", 4, "policy-scale-13a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
    ["ScaleTest 14a", 4, "policy-scale-14a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
    ["ScaleTest 15a", 4, "policy-scale-15a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
    ["ScaleTest 16a", 1, "policy-scale-16a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 17a", 1, "policy-scale-17a.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	
	["ScaleTest 1", 1, "policy-scale-1.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 2", 1, "policy-scale-2.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 3", 1, "policy-scale-3.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 4", 1, "policy-scale-4.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 5", 1, "policy-scale-5.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 6 u1", 4, "policy-scale-6.xml", "user1", "cert1", "http://mega.org/api/secret1", "device1"],
	["ScaleTest 6 u2", 6, "policy-scale-6.xml", "user2", "cert2", "http://mega.org/api/secret2", "device2"],
	["ScaleTest 6 u3", 6, "policy-scale-6.xml", "user3", "cert3", "http://mega.org/api/secret3", "device3"],

	["FirstApplicableTest 1", 4, "policy-scale-first-1.xml", "user1", "cert1", "http://mega.org/api/secret3", "device1"],
	["FirstApplicableTest 2", 1, "policy-scale-first-2.xml", "user1", "cert1", "http://mega.org/api/secret3", "device1"],
	["FirstApplicableTest 3", 1, "policy-scale-first-3.xml", "user1", "cert1", "http://mega.org/api/secret3", "device1"],
	["FirstApplicableTest 4", 4, "policy-scale-first-4.xml", "user1", "cert1", "http://mega.org/api/secret3", "device1"],
	["FirstApplicableTest 5", 1, "policy-scale-first-5.xml", "user1", "cert1", "http://mega.org/api/secret3", "device1"],
	["FirstApplicableTest 6", 4, "policy-scale-first-6.xml", "user1", "cert1", "http://mega.org/api/secret3", "device1"]	
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


function timeDiff(message, startDate, endDate){
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

	console.log( "\t" + message + " " + startTime + " -- " + endTime + " -- " + m2 ); 

 
    
}

function checkFeature(policyName, userName, certName, featureName, deviceId, purpose, obligations) {
	console.log(); 

var dateStart = new Date();

	changepolicy(policyName);

var dateChangedPolicy = new Date(); 

	pm = loadManager();

var dateLoadPolicy = new Date();

	var req = setRequest(userName, certName, featureName, deviceId, purpose, obligations);

var dateSetRequestPolicy = new Date();

	var testWrap = new TestWrapper(); 

var dateCreateTestWrap = new Date();
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

	var dateEnd = new Date();

	timeDiff("Change Policy Time = ", dateStart, dateChangedPolicy);

	timeDiff("Load Policy Time = ", dateChangedPolicy, dateLoadPolicy);

	timeDiff("Set Request Time = " , dateLoadPolicy, dateSetRequestPolicy);

	timeDiff("Create wrap Time = " , dateSetRequestPolicy, dateCreateTestWrap);

	timeDiff("Process request Time = ", dateCreateTestWrap, dateEnd);

	timeDiff("Total Time = " , dateStart, dateEnd);





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
