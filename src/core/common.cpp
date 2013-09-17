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
 * Copyright 2011 Telecom Italia SpA
 * 
 ******************************************************************************/

#include <cstdio>
#include <cstring>
#include <cassert>
#include "common.h"
#include "../debug.h"
#include "../../contrib/xmltools/slre.h"


using namespace std;
/*
 * Useful common functions
 */

/* Regular expression matching
 * -----------------------------------------------------------
 * BONDI specification refers to ECMAScript 3 regular expression, that
 * is perl-like stype, not POSIX-like such as (BRE,ERE).  
 * The chosen SLRE library (http://slre.sourceforge.net/) is a reduced
 * Perl-like style of regular expression, like the same ECMAScript is.
 * */

bool compare_regexp(const string& target,const string& expression) {
    struct slre slre;
    struct cap  captures[MAX_CAPTURES];

    if (!slre_compile(&slre,expression.c_str())) {
//	    printf("Error compiling RE: %s\n", slre.err_str);
    	return false;
    } 
    else
	if (!slre_match(&slre, target.c_str(),strlen(target.c_str()), captures)) { 
//	    printf("Not matching!\n" ); 
	    return false;
	} 
	else { 
//	    printf("Capture: %.*s\n", captures[0].len, captures[0].ptr);
	    return true;
	}
    return false;
}
bool compare_numbers(const string& str1, const string& str2, int mode){
	//TODO verify conversion string to int
	//LOGD("STR1: %s", str1.c_str());
	int num1 = atoi(str1.c_str());
	int num2 = atoi(str2.c_str());
	if((num1 == 0 && str1.length() > 1) ||
		(num2 == 0 && str2.length() > 1)){
		LOGD("[common.cpp]Wrong timemin format");
		return false;
	}
	//LOGD("NUM1: %d", num1);
	//LOGD("NUM2: %d", num2);
	switch(mode){
		case STRCMP_GREATER_THAN:
			if(num1 > num2){
				//LOGD("GT - RETURNING TRUE");
				return true;
			}
			//LOGD("GT - RETURNING FALSE");
			return false;
		case STRCMP_GREATER_EQUAL_THAN:
			if(num1 >= num2)
				return true;
			return false;
		case STRCMP_LESS_THAN:
			if(num1 < num2){
				//LOGD("LT - RETURNING TRUE");
				return true;
			}
			//LOGD("LT - RETURNING FALSE");
			return false;
		case STRCMP_LESS_EQUAL_THAN:
			if(num1 <= num2)
				return true;
			return false;
	}
	return false;
}
bool compare_in_set(const string& str1, const string& str2){
	//TODO verify conversion string to int
	unsigned long num1 = strtoul(str1.c_str(), NULL, 10);
	unsigned long num2 = strtoul(str2.c_str(), NULL, 10);
	//LOGD("IN-SET NUM1: %lu", num1);
	//LOGD("IN-SET NUM2: %lu", num2);
	if( (num1 == 0 && str1.length() > 1) ||
			(num2 == 0 && str2.length() > 1)){
			LOGD("[common.cpp]Wrong day format");
			return false;
		}
	unsigned long result = num1 & num2;
	//LOGD("IN-SET RESULT: %lu", result);
	if(result != 0) return true;
	return false;
}
string glob2regexp (const string& glob) {
    string result = "";
    for (unsigned int i = 0;i<glob.size();++i)
    {
	if (glob[i]=='?')
	    result+=".";
	else
	    if (glob[i]=='*')
		result+=".*";
	    else
		result+=glob[i];
    }
	// ABOT Commented the following line because I was getting an xstring assert fail "string subscript out of range"
    //result[glob.size()] = 0;
    return result;
}

bool compare_globbing (const string& target,const string& expression) {
    // TODO: implementation
   
    return compare_regexp(target,glob2regexp(expression));
}

bool equals(const string& s1, const string& s2, const int mode) { 
    // TODO: string bag (remove spaces)
    // check regular expression according to BONDI spec
    switch (mode)
    {
	case STRCMP_NORMAL:
	    return (s1.compare(s2)==0); 
	case STRCMP_REGEXP:
	    return compare_regexp(s1,s2);
	case STRCMP_GLOBBING:
	    return compare_globbing(s1,s2);
	case STRCMP_GREATER_THAN:
		return compare_numbers(s1,s2,mode);
	case STRCMP_GREATER_EQUAL_THAN:
		return compare_numbers(s1,s2,mode);
	case STRCMP_LESS_THAN:
		return compare_numbers(s1,s2,mode);
	case STRCMP_LESS_EQUAL_THAN:
		return compare_numbers(s1,s2,mode);
	case STRCMP_IN_SET:
		return compare_in_set(s1,s2);
	default:
	    assert(false);
    }
}

bool contains(const strings& container, const strings& contained) {
  for(strings::const_iterator it=contained.begin(); it!=contained.end(); it++) {
    if(!contains(container, *it)) return false;
  }
  return true;
}

int string2strcmp_mode(const string& s){
	if(s == "glob")
		return STRCMP_GLOBBING;
	if(s == "equal")
		return STRCMP_NORMAL;
	if(s == "regexp")
		return STRCMP_REGEXP;
	if(s == "greater-than")
		return STRCMP_GREATER_THAN;
	if(s == "greater-equal-than")
		return STRCMP_GREATER_EQUAL_THAN;
	if(s == "less-than")
		return STRCMP_LESS_THAN;
	if(s == "less-equal-than")
		return STRCMP_LESS_EQUAL_THAN;
	if(s == "in-set"){
		return STRCMP_IN_SET;
	}
	return -1;
}
