/*
 * PolicyDescriptor.h
 *
 *  Created on: 25/giu/2013
 *      Author: valerio
 */

#ifndef POLICYDESCRIPTOR_H_
#define POLICYDESCRIPTOR_H_
#include "Globals.h"
#include "IPolicyBaseDescriptor.h"
#include <map>
#include <vector>

class PolicyDescriptor : public IPolicyBaseDescriptor{
public:
	PolicyDescriptor();
	PolicyDescriptor(string id);
	virtual ~PolicyDescriptor();
	void addRule(int effect, string id, int position);
	string toJSONString();
private:
	map<int,vector<pair<string, int> > > rules;
};


#endif /* POLICYDESCRIPTOR_H_ */
