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
 * Copyright 2013 Andreas Botsikas, National Technical University of Athens
 *
 ******************************************************************************/

var jasmine = require("jasmine-node");
var nodePath = require('path');
 
var testFolder = function(path){
	var jasmineOptions = {
		specFolders: [nodePath.join(__dirname,path)],
		showColors: true,
		isVerbose: false
	};
	jasmine.executeSpecsInFolder(jasmineOptions); 
};
testFolder('../jasmine/');
// Run scenarios related tests
testFolder('../jasmine.scenarios/');
// Run Mark Slaymaker's tests
testFolder('../jasmine.policy.tests.working/');

