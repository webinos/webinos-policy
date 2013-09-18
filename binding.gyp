{
  'variables': {
    'module_name': 'pm',#Specify the module name here
  },
  'targets': [
    {
        # Needed declarations for the target
        'target_name': '<(module_name)',
        'product_name':'<(module_name)',
        'sources': [ #Specify your source files here
            "src/pm.cc",
            "src/core/policymanager/PolicyManager.cpp",
            "src/core/policymanager/Condition.cpp",
            "src/core/policymanager/Globals.cpp",
            "src/core/policymanager/IPolicyBase.cpp",
            "src/core/policymanager/Policy.cpp",
            "src/core/policymanager/PolicySet.cpp",
            "src/core/policymanager/Request.cpp",
            "src/core/policymanager/Rule.cpp",
            "src/core/policymanager/Subject.cpp",
            "src/core/policymanager/AuthorizationsSet.cpp",
            "src/core/policymanager/DataHandlingPreferences.cpp",
            "src/core/policymanager/Obligation.cpp",
            "src/core/policymanager/ObligationsSet.cpp",
            "src/core/policymanager/ProvisionalAction.cpp",
            "src/core/policymanager/ProvisionalActions.cpp",
            "src/core/policymanager/TriggersSet.cpp",
            "src/core/policymanager/IPolicyBaseDescriptor.cpp",
            "src/core/policymanager/PolicyDescriptor.cpp",
            "src/core/policymanager/PolicySetDescriptor.cpp",
            "src/core/common.cpp",
            "contrib/xmltools/tinyxml.cpp",
            "contrib/xmltools/slre.cpp",
            "contrib/xmltools/tinystr.cpp",
            "contrib/xmltools/tinyxmlparser.cpp",
            "contrib/xmltools/tinyxmlerror.cpp",
        ],
        'include_dirs': [
           'src/core/policymanager',
           'src/core',
        ],
    },
     {
            # Needed declarations for the target
            'target_name': 'promptMan',
            'product_name':'promptMan',
            'conditions': [
                [ 'OS=="linux"', {
                  'sources': [
                    'src/promptMan/promptMan.cc',
                  ],
                }],

                [ 'OS=="mac"', {
                  'sources': [
                    'src/promptMan/promptMan_Darwin.cc',
                  ],
                }],

                [ 'OS=="win"', {
                  'sources': [
                    'src/promptMan/promptMan_Win.cpp',
                  ],
                }],
            ],
        },
    {
        'target_name': 'webinos_wrt',
        'type': 'none',
        'toolsets': ['host'],
        'copies': [
          {
            'files': [
              '<(PRODUCT_DIR)/pm.node',
              '<(PRODUCT_DIR)/promptMan.node',
            ],
            'destination': 'node_modules/',
          }],
        }, # end webinos_wrt
  ] # end targets
}

