Testing ci
# webinos-policy

A Nodejs XACML-like access control policy engine, developed as part of the webinos project.

## Functionalty

* Currently works with the webinos-pzp component
* Provides a mediation interface, so that any component may defer decision to the access logic
* Interprets a set of policy rules active on the PZP
* Implement real-time policy enforcement (PEP) logic and enforce the constraints

## Compilation

To compile the policy manager:

Linux/Mac: 
> npm install

Android:
> ndk-build NDK_PROJECT_PATH=. NDK_APPLICATION_MK=Application.mk

## Test

To test the policy manager:

Linux/Mac:
> npm test



