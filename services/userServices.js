const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');

const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const createToken = require('../utils/createToken');
const db = require('../models');

// Upload single image
exports.uploadUserImage = uploadSingleImage('profileImg');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/users/${filename}`);

    // Save image into our db
    req.body.profileImg = filename;
  }

  next();
});

// Get Logged user data
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

// Update logged user password
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1) Update user password based on user payload (req.user.id)
  //const user = await db.User.findByPk(req.user.id);
  const user = await db.User.findOne({ where: { id: req.user.id } })

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  user.password = await bcrypt.hash(req.body.password, 12);
  user.passwordChangedAt = new Date();
  await user.save();

  // 2) Generate token
  const token = createToken(user.id);

  res.status(200).json({ data: user, token });
});

// Update logged user data (without password, role)
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await db.User.update(
    {
      name: req.body.name,
      phone: req.body.phone,
      profileImg: req.body.profileImg,
    },
    { where: { id: req.user.id }, returning: true }
  );

  if (updatedUser[0] === 0) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json({ data: updatedUser[1][0] });
});

// Deactivate logged user
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  const result = await db.User.update({ active: false }, { where: { id: req.user.id } });

  if (result[0] === 0) {
    return next(new ApiError('User not found', 404));
  }else{
    res.json({status: 'Success'})
  }

  
});

// ------ ADMIN ONLY -----

// Get list of users
exports.getUsers = factory.getAll(db.User);


// Get specific user by id
exports.getUser = factory.getOne(db.User);

// Create user
exports.createUser = factory.createOne(db.User);

// Delete specific user
exports.deleteUser = factory.deleteOne(db.User);

// Update specific user
exports.updateUser = asyncHandler(async (req, res, next) => {
  const [rowsCount, updatedUser] = await db.User.update(
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone,
      email: req.body.email,
      profileImg: req.body.profileImg,
      role: req.body.role,
    },
    { where: { id: req.params.id }, returning: true }
  );

  if (rowsCount === 0) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }

  res.status(200).json({ data: updatedUser[0] });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const [rowsCount, updatedUser] = await db.User.update(
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: new Date(),
    },
    { where: { id: req.params.id }, returning: true }
  );

  if (rowsCount === 0) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }

  res.status(200).json({ data: updatedUser[0] });
});
