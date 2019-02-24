// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const puppet = require('./bedpresPuppet');
// The Firebase Admin SDK to access the Firebase Realtime Database.
// const admin = require('firebase-admin');
// admin.initializeApp();


exports.add = functions.runWith({memory: '512MB'}).https.onRequest( (request, response) => {
    try {
        console.log("BODY", request.body);
        var jsonObj = request.body;
        var user = new puppet.User(jsonObj.username, jsonObj.password, jsonObj.email);
        puppet.add(user).then(res => {
            response.sendStatus(200);
            response.end();
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

exports.run = functions.runWith({memory: '512MB'}).https.onRequest( (request, response) => {
    try {
        puppet.run().then(res => {
            response.sendStatus(200);
            response.end();
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});
