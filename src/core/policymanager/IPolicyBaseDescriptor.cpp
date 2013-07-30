/*
 * IPolicyBaseDescriptor.cpp
 *
 *  Created on: 25/giu/2013
 *      Author: valerio
 */
#include "IPolicyBaseDescriptor.h"
IPolicyBaseDescriptor::IPolicyBaseDescriptor() {
	id = "";
	position = 0;
	type = POLICY;
}
IPolicyBaseDescriptor::IPolicyBaseDescriptor(string id) {
	this->id = id;
	position = 0;
	type = POLICY;
}
IPolicyBaseDescriptor::~IPolicyBaseDescriptor() {

}
string IPolicyBaseDescriptor::toJSONString() {
	return "HERE";
}
string IPolicyBaseDescriptor::numberToString(int number) {
	ostringstream ss;
	ss << number;
	return ss.str();
}

