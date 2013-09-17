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

#include "Subject.h"
#include "Policy.h"


Subject::Subject(TiXmlElement* subject, map<string, vector<string>*> *pip){
	for(TiXmlElement * child = (TiXmlElement*)subject->FirstChild("subject-match"); child;
			child = (TiXmlElement*)child->NextSibling() ) {
		
		string tmp = (child->Attribute("match")!=NULL) ? child->Attribute ("match") : "";
		if (tmp.length() == 0)
			tmp = (child->GetText() != NULL) ? child->GetText() : "";
		
		int nextPos, pos = 0;
		while(pos < (int)tmp.length())
		{
			//nextPos = tmp.find(" ",pos);
			//if (nextPos == (int)string::npos)
			nextPos = tmp.length();			
			if(pos != nextPos){
				string attr = child->Attribute("attr");
				int dot_pos = attr.find(".");
				string key = (dot_pos != (int)string::npos) ? attr.substr(0, dot_pos) : attr;
				match_info_str * tmp_info = new match_info_str();
				tmp_info->equal_func = (child->Attribute("func")!=NULL) ? child->Attribute("func") : "glob";
				tmp_info->value = tmp.substr(pos, nextPos-pos);
				
				tmp_info->mod_func = (dot_pos != (int)string::npos) ? attr.substr(dot_pos+1) : "";
				LOGD("subject() %d - equal_func=%s, value=%s, mod_func=%s", pos, tmp_info->equal_func.data(), tmp_info->value.data(), tmp_info->mod_func.data());

				if (pip !=NULL)
				{
					string genericURI_PzOwner = string ("http://webinos.org/subject/id/PZ-Owner");
					size_t found_PzOwner = tmp_info->value.find(genericURI_PzOwner);
					if (found_PzOwner != string::npos)
					{
						if (pip->find(genericURI_PzOwner) != pip->end() && (*pip)[genericURI_PzOwner]->size() > 0) 
						{
							string user = (*pip)[genericURI_PzOwner]->at(0);
							tmp_info->value.replace(found_PzOwner, genericURI_PzOwner.length(), user);
						}
					}

					string genericURI_known = string ("http://webinos.org/subject/id/known");
					size_t found_known = tmp_info->value.find(genericURI_known);
					if (found_known != string::npos)
					{
						if (pip->find(genericURI_known) != pip->end() && (*pip)[genericURI_known]->size() > 0) 
						{
							string known = "";
							for (unsigned int i = 0; i < (*pip)[genericURI_known]->size(); i++) 
							{
								known += (i ? "," : "") + (*pip)[genericURI_known]->at(i);
							}
							tmp_info->value.replace(found_known, genericURI_known.length(), known);
						}
					}
				}

				info[key].push_back(tmp_info);
			}
			pos = nextPos+1;
		}
	}
	LOGD("[Subject]  : subjects-match size : %lu",info.size());
}

Subject::~Subject()
	{
	// TODO Auto-generated destructor stub
	}

bool Subject::match(Request* req){
	bool foundInBag = false;
	for(map<string,vector<match_info_str*> >::iterator it_policy=info.begin(); it_policy != info.end(); it_policy++){
		 
		// For Debug
		LOGD("[Subject] cerco in %s ",it_policy->first.data());
		for(map<string,vector<string>* >::iterator it=req->getSubjectAttrs().begin(); it != req->getSubjectAttrs().end(); it++)
			LOGD("[Subject] req %s",it->first.data());
		
		
		if(req->getSubjectAttrs().find(it_policy->first) != req->getSubjectAttrs().end()){
			vector<string>* req_vet = req->getSubjectAttrs()[it_policy->first];
			vector<match_info_str*> info_vet = it_policy->second;		
			for(unsigned int j=0;j<info_vet.size(); j++){ //iteration on all policy's elements
				foundInBag = false;
				for(unsigned int i=0; !foundInBag && i<req_vet->size(); i++){ //iteration on request's elements. 
					string mod_function = info_vet[j]->mod_func;
					LOGD("Subject.match() - mod_function=%s - req_vet=%s", mod_function.data(), req_vet->at(i).data());

                    vector<string> bagVector = split(info_vet[j]->value.data(), ',');

                    for(vector<string>::iterator it_bag = bagVector.begin(); it_bag != bagVector.end(); it_bag++) {
						string s = (mod_function != "") 
							? modFunction(mod_function, req_vet->at(i))
							: req_vet->at(i);
						LOGD("[Subject] Compare %s with %s ",s.data(),it_bag->data());
						if(equals(s, it_bag->data(), string2strcmp_mode(info_vet[j]->equal_func))){
							foundInBag = true;
							LOGD("[Subject] Found subject-match for %s ",s.data());
						}
					}
				}
				if(!foundInBag)
					return false;
			}
		}
		else
			return false;
	}
	return true;
}
