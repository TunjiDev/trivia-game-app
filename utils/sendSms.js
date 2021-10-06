module.exports = async function(to, message) {
  const AppError = require('../src/error/appError');
  const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const msg = await client.messages
    .create({
      body: message,
      to: to,
      from: process.env.TWILO_NUMBER
    })
    .catch(_err => {
      throw new AppError(`Could not send message to ${to}, Try Again`, 500);
    });

  if (!msg) return false;

  if (process.env.NODE_ENV === 'development') {
    console.log(msg.body);
  }
  // Else
  return true;
};
