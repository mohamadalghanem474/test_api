const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const sendEmail = require('../utils/sendEmail');
const createToken = require('../utils/createToken');
const db = require('../models');

/*
signup
sendVerifyEmailCod
verifyEmaile
login
forgotPassword
verifyPassResetCode
resetPassword
*/

// Signup
exports.signup = asyncHandler(async (req, res, next) => {
  // 1- Create user
  const user = await db.User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone
  });

  res.status(201).json({ status: 'Success', data: user });
});

// Login
exports.login = asyncHandler(async (req, res, next) => {
  // 1) check if password and email in the body (validation)
  // 2) check if user exist & check if password is correct
  const user = await db.User.findOne({ where: { email: req.body.email } });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError('Incorrect email or password', 401));
  }
  
  // 3) generate token
  const token = createToken(user.id);

  // Delete password from response
  delete user.dataValues.password;
  // 4) send response to client side
  res.status(200).json({ data: user, token });
});

// Forgot password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await db.User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  
  // 2) If user exists, generate reset code and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  // 3) Send the reset code via email
  const message = `Hi ${user.name},\n We received a request to reset the password on your ${process.env.COMPANY_NAME} Account. \n [${resetCode}] \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The ${process.env.COMPANY_NAME} Team`;

  try {
    console.log({"message":message});
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset code (valid for 10 min)',
    //   message,
    // });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    console.log(err);

    await user.save();
    return next(new ApiError('There is an error in sending email', 500));
  }

  res
    .status(200)
    .json({ status: 'Success', message: 'Reset code sent to email' });
});

// Verify password reset code
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  const user = await db.User.findOne({
    where: {
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    },
  });
  if (!user) {
    return next(new ApiError('Reset code invalid or expired'));
  }

  // 2) Reset code is valid
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: 'Success',
  });
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const user = await db.User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if reset code is verified
  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // 3) if everything is ok, generate token
  const token = createToken(user.id);
  res.status(200).json({ status: 'Success', token });
});

// Send verification email code
exports.sendVerifyEmailCode = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await db.User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }

  // 2) If user exists, generate reset code and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  // 3) Send the verification code via email
  const message = `Hi ${user.name},\n We received a request to verify your email on your ${process.env.COMPANY_NAME} Account. \n [${resetCode}] \n Enter this code to complete the email verification. \n Thanks for helping us keep your account secure.\n The ${process.env.COMPANY_NAME} Team`;
  try {
    console.log({"message":message});
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset code (valid for 10 min)',
    //   message,
    // });
  } catch (err) {
    user.emailVerifyCode = undefined;
    console.log(err);

    await user.save();
    return next(new ApiError('There is an error in sending email', 500));
  }
  res
    .status(200)
    .json({ status: 'Success', message: 'Email verification code sent to email' });
});

// Verify Email
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const user = await db.User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if verification code is valid
  if (!user.emailVerifyCode) {
    return next(new ApiError('Email verification code not verified', 400));
  }
  user.emailVerified = true;
  user.emailVerifyCode = undefined;

  await user.save();

  // 3) if everything is ok, generate token
  const token = createToken(user.id);
  res.status(200).json({ status: 'Success', token });
});
