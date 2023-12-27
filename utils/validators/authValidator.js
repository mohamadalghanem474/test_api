const slugify = require('slugify');
const { check } = require('express-validator');
const { User } = require('../../models/userModel'); // تأكد من تعديل المسار وفقًا لمكان نموذج المستخدم
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.signupValidator = [
  check('name')
    .notEmpty()
    .withMessage('User required')
    .isLength({ min: 3 })
    .withMessage('Too short User name')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ where: { email: val } }).then((user) => {
        if (user) {
          return Promise.reject(new Error('E-mail already in use'));
        }
      })
    ),

  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation required'),

  check('phone')
    .custom((value) => {
      // أداء التحقق من رقم الهاتف بطريقة مخصصة بناءً على متطلباتك
      // يمكنك استخدام مكتبة مثل 'libphonenumber-js' للتحقق من رقم الهاتف بشكل أفضل
      // يجب تحديد نمط رقم الهاتف الذي تتوقعه
      // مثال: إذا كنت تتوقع أرقام هواتف لبنان، يمكنك استخدام check('phone').isMobilePhone(['ar-LB'])
      return true;
    }),

  validatorMiddleware,
];

exports.loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address'),

  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  validatorMiddleware,
];
