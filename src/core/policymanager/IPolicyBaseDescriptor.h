/*
 * IPolicyBaseDescriptor.h
 *
 *  Created on: 25/giu/2013
 *      Author: valerio
 */

#ifndef IPOLICYBASEDESCRIPTOR_H_
#define IPOLICYBASEDESCRIPTOR_H_
#include "Globals.h"
#include <sstream>
class IPolicyBaseDescriptor{
public:
	string id;
	int position;
    int effect;
	PolicyType type;
	string combine;
	IPolicyBaseDescriptor();
	IPolicyBaseDescriptor(string id);
	virtual ~IPolicyBaseDescriptor();
	virtual string toJSONString();
	static string numberToString(int number);
};



#endif /* IPOLICYBASEDESCRIPTOR_H_ */
