{
  'targets':
  [
    {
       # Needed declarations for the target
      'target_name': 'certificate_manager',
      'product_name': 'certificate_manager',
        'sources': [ #Specify your source files here
          'src/certificate_manager.cpp',
          'src/openssl_wrapper.cpp',
        ],

      'conditions': [
        [ 'OS=="win"', {
          #we need to link to the libeay32.lib
          'libraries': ['-l<(openssl_Root)/lib/libeay32.lib' ],
          'include_dirs': ['<(openssl_Root)/include'],
        }],
        [ 'OS=="freebsd" or OS=="openbsd" or OS=="mac" or OS=="solaris" or OS=="linux"', {
          'libraries': ['-lssl', '-lcrypto'],
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
          'build/$(CONFIGURATION)/certificate_manager.node',
        ],
        'destination': 'node_modules/',
      }],
    }, # end webinos_wrt
  ] # end targets
}

