/*
 * PolicyDescriptor.cpp
 *
 *  Created on: 25/giu/2013
 *      Author: valerio
 */
#include "PolicyDescriptor.h"
#include "../../debug.h"
#include <stdio.h>

PolicyDescriptor::PolicyDescriptor() {
	this->type = POLICY;
}
PolicyDescriptor::PolicyDescriptor(string id) {
	this->id = id;
	this->type = POLICY;
}
PolicyDescriptor::~PolicyDescriptor() {
	/*
	 for(map<Effect, vector<pair<string, int>* >* >::iterator itmap = rules.begin(); itmap != rules.end(); itmap++){
	 for(vector<pair<string, int>* >::iterator itvec = itmap->second->begin(); itmap->second->end(); itvec++){
	 delete (*itvec);
	 }
	 delete  *itmap;
	 }
	 delete rules;
	 */
}
void PolicyDescriptor::addRule(int effect, string id, int position) {
	vector<pair<string, int> > effectRules;
	if (rules.find(effect) == rules.end()) {
		pair<int, vector<pair<string, int> > > effectRules;
		effectRules.first = effect;
		rules.insert(effectRules);
	}
	pair<string, int> value;
	value.first = id;
	value.second = position;
	rules[effect].push_back(value);
	LOGD("[PolicyDescriptor] Added Rule with effect: %d, id: %s, position: %d",
			effect, id.c_str(), position);
}
string PolicyDescriptor::toJSONString() {
	string result = "";
	LOGD("[PolicyDescriptor] ID = %s, POSITION = %d", id.c_str(), position);

	result.append("{");

	result.append(" \"type\":\"policy\", ");
	result.append(" \"id\":\"" + id + "\", ");
	result.append(" \"combine\":\"" + combine + "\",");
	result.append(" \"effect\":\"" + IPolicyBaseDescriptor::numberToString(effect) + "\",");

	result.append(" \"position\":\"" + IPolicyBaseDescriptor::numberToString(position) + "\"" );
	if (!rules.empty()) {
		result.append(", ");
		result.append(" \"rules\":");
		result.append("{");
		for (map<int, vector<pair<string, int> > >::iterator itmap =
				rules.begin(); itmap != rules.end(); ) {
			LOGD("[PolicyDescriptor] Effect = %d", itmap->first);
			result.append(" \""+ IPolicyBaseDescriptor::numberToString(itmap->first)+"\": [");
			for (vector<pair<string, int> >::iterator itvec =
					itmap->second.begin(); itvec != itmap->second.end();
					) {
				LOGD("[PolicyDescriptor]Rule id = %s, position = %d",
						itvec->first.c_str(), itvec->second);
				result.append("{");
				result.append("\"id\":\""+itvec->first+"\", ");
				result.append("\"position\":\""+IPolicyBaseDescriptor::numberToString(itvec->second)+"\"");
				result.append("}");
				itvec++;
				if(itvec != itmap->second.end()){
					result.append(", ");
				}
			}
			result.append("]");
			itmap++;
			if(itmap != rules.end())
				result.append(", ");
		}
		result.append("}");
	}
	result.append("}");
	return result;
}

