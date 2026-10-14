const admin = require("../config/firebase");

const sendNotification = async ({ token, title, body, data }) => {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: data || {},
  };

  return await admin.messaging().send(message);
};

module.exports = { sendNotification };