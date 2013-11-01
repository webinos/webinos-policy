/*
 * PolicySetDescriptor.cpp
 *
 *  Created on: 25/giu/2013
 *      Author: valerio
 */
#include "PolicySetDescriptor.h"
#include "../../debug.h"
#include <stdio.h>
PolicySetDescriptor::PolicySetDescriptor() {
	this->type = POLICY_SET;
}
PolicySetDescriptor::PolicySetDescriptor(string id) {
	this->id = id;
	this->position = position;
	this->type = POLICY_SET;
}
PolicySetDescriptor::~PolicySetDescriptor() {
	for (vector<IPolicyBaseDescriptor*>::iterator it = policyChilds.begin();
			it != policyChilds.end(); it++) {
		delete *it;
	}
	for (vector<IPolicyBaseDescriptor*>::iterator it = policySetChilds.begin();
			it != policySetChilds.end(); it++) {
		delete *it;
	}
}
void PolicySetDescriptor::addChild(IPolicyBaseDescriptor* child) {
	if (child->type == POLICY_SET)
		policySetChilds.push_back(child);
	else
		policyChilds.push_back(child);
}
string PolicySetDescriptor::toJSONString() {
	string result = "";
	LOGD("[PolicySetDescriptor] id = %s, position = %d", id.c_str(), position);
	//result.append("POLICYSET 'id':'" + id + "'");
	result.append("{");

	result.append(" \"type\":\"policy-set\",");

	result.append(" \"id\":\"" + id + "\",");
	result.append(" \"combine\":\"" + combine + "\",");
	result.append(" \"effect\":\"" + IPolicyBaseDescriptor::numberToString(effect) + "\",");
	result.append(
			" \"position\":\"" + IPolicyBaseDescriptor::numberToString(position)+"\"");
	if (!policyChilds.empty()) {
		result.append(",");
		result.append(" \"policy\": [");
		for (vector<IPolicyBaseDescriptor*>::iterator it1 =
				policyChilds.begin(); it1 != policyChilds.end();) {
			//result.append("\n");
			//result.append((*it)->toJSONString());
			result.append((*it1)->toJSONString());
			it1++;
			if (it1 != policyChilds.end())
				result.append(", ");
		}
		result.append("]");
	}
	if (!policySetChilds.empty()) {
		result.append(", ");
		result.append(" \"policy-set\": [");
		for (vector<IPolicyBaseDescriptor*>::iterator it2 =
				policySetChilds.begin(); it2 != policySetChilds.end();) {
			//result.append("\n");
			//result.append((*it)->toJSONString());
			result.append((*it2)->toJSONString());
			it2++;
			if (it2 != policySetChilds.end())
				result.append(", ");
		}
		result.append("]");
	}
	result.append("}");
	return result;
}

