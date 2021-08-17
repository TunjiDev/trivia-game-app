const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/appError");

exports.createUser = catchAsync(async (req, res, next) => {
  // 1. Get Phone number
  const rawPhone = req.body.phoneNumber;
  // 2. Validate number

  // 3. create user with TWILO_NUMBER
  // 4. send OTP
  const isSent = await sendSms(phone, `Your OTP is ${code}`);

  if (!isSent) return next(new AppError(`Could't Send OTP`, 400));

  res.status(200).json({
    status: "success",
    message: "OTP has been sent, Verify to proeed",
  });
});
