const admin = require("firebase-admin");
const serviceAccount = require("../../social-media-app-ab0b4-firebase-adminsdk-fbsvc-c9fedfc883.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;