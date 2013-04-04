{
  'variables': {
    'module_name': 'promptMan',#Specify the module name here
  },
  'targets': [
    {
	    # Needed declarations for the target
	    'target_name': 'promptMan',
	    'product_name':'promptMan',
	    'conditions': [
			[ 'OS=="linux"', {
			  'sources': [            
				'promptMan.cc',
			  ],
			}],

			[ 'OS=="mac"', {
			  'sources': [            
				'promptMan_Darwin.cc',
			  ],
			}],

			[ 'OS=="win"', {
			  'sources': [            
				'promptMan_Win.cpp',
			  ],
			}],
		],
    },
  ] # end targets
}

