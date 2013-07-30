/*
 * PolicySetDescriptor.h
 *
 *  Created on: 25/giu/2013
 *      Author: valerio
 */

#ifndef POLICYSETDESCRIPTOR_H_
#define POLICYSETDESCRIPTOR_H_
#include "IPolicyBaseDescriptor.h"
#include <vector>
class PolicySetDescriptor : public IPolicyBaseDescriptor{
public:
	PolicySetDescriptor();
	PolicySetDescriptor(string id);
	virtual ~PolicySetDescriptor();
	void addChild(IPolicyBaseDescriptor* child);
	string toJSONString();
private:
	vector<IPolicyBaseDescriptor*> policyChilds;
	vector<IPolicyBaseDescriptor*> policySetChilds;
};


#endif /* POLICYSETDESCRIPTOR_H_ */
