module.exports = async function (to, message) {
  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const msg = await client.messages.create({
    body: message,
    to: to,
    from: process.env.TWILO_NUMBER,
  });

  if (!msg) return false;

  if (process.env.NODE_ENV === "development") {
    console.log(msg.body);
  }
  // Else
  return true;
};
