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

### Scenarios related to tests in test/jasmine.scenarios/

1.  Pre-journey: 10 minutes before the journey

 Helen and Eric are getting ready to visit Peter.  Helen wants to ensure Eric has access to some videos for the journey.
 * From: helen_jennings@pzh.webinos.org/HeleniPhone
 * To: helen_jennings@pzh.webinos.org/HeleniMac
 * Resource: http://webinos.org/api/mediacontent
 * Environment: Helen Family
 * Expected Result: ALLOW

2.  Stuck in traffic: 30 minutes into the journey

 Helen’s car is stuck in traffic as she pulls onto motorway.  Helen calls Peter to say she’s running late.  Peter runs up KiF to see where Helen is.
 * From: peter_jones@pzh.webinos.org/PeteriPad
 * To: helen_jennings@pzh.webinos.org/HelenGalaxyNote
 * Resource: http://webinos.org/api/w3c/geolocation
 * Environment: Helen Travel
 * Expected Result: DENY

3.  Service station: 2 hours into the journey

 Helen has pulled into a service station for a comfort stop.  Because Eric is bored of the videos and getting restless, Helen asks Peter to keep an eye on Eric.  Peter decides to connect to Eric’s KiF session to play a card game.
 * From: peter_jones@pzh.webinos.org/PeterTV
 * To: helen_jennings@pzh.webinos.org/HelenGalaxyNote
 * Resource: http://webinos.org/api/w3c/webrtc
 * Environment: Helen Travel
 * Expected Result: ALLOW

 and
 * From: helen_jennings@pzh.webinos.org/HelenGalaxyNote
 * To: peter_jones@pzh.webinos.org/PeterTV
 * Resource: http://webinos.org/api/w3c/webrtc
 * Environment: Peter Home
 * Expected Result: ALLOW

4.  Motorway: 2.5 hours into the journey

 Helen is distracting by how loud both Eric and Peter are.  Helen turns towards the back-seat and, over the microphone, asks Peter to turn the speaker volume down.
 * From: peter_jones@pzh.webinos.org/PeteriPad
 * To: helen_jennings@pzh.webinos.org/HelenGalaxyNote
 * Resource: http://webinos.org/api/deviceinteraction
 * Environment: Helen Travel
 * Expected Result: ALLOW

5.  Country lane: 3 hours into the journey

 There is only about an hour left, but Eric has become bored to the game and is becoming restless again.  Helen asks Peter to put a video on for Eric.  Peter can’t find anything on Helen’s iMac so selects a video for Peter from his own library.
 * From: peter_jones@pzh.webinos.org/PeteriPad
 * To: helen_jennings@pzh.webinos.org/HeleniMac
 * Resource: http://webinos.org/api/mediacontent
 * Environment: Helen Travel
 * Expected Result: DENY

 and
 * From: helen_jennings@pzh.webinos.org/HelenGalaxyNote
 * To: peter_jones@pzh.webinos.org/PeterTV
 * Resource: http://webinos.org/api/mediacontent
 * Environment: Peter Home
 * Expected Result: ALLOW
