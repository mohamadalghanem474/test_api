const slugify = require("slugify");
const bcrypt = require("bcryptjs");
const { check, body } = require("express-validator");
const { PhoneNumberUtil } = require("google-libphonenumber");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const db = require("../../models");

const phoneUtil = PhoneNumberUtil.getInstance();

exports.createUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("User required")
    .isLength({ min: 3 })
    .withMessage("Too short User name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      db.User.findOne({ where: { email: val } }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in user"));
        }
      })
    ),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation required"),

  check("phone")
    .optional()
    .custom((value) => {
      try {
        const phoneNumber = phoneUtil.parseAndKeepRawInput(value, "LB");
        if (!phoneUtil.isValidNumber(phoneNumber)) {
          throw new Error("Invalid phone number for Lebanon");
        }
        return true;
      } catch (error) {
        throw new Error("Invalid phone number format");
      }
    }),

  check("profileImg").optional(),
  check("role").optional(),

  validatorMiddleware,
];

exports.getUserValidator = [
  //[TODO]//
  validatorMiddleware,
];

exports.updateUserValidator = [
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ where: { email: val } }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in user"));
        }
      })
    ),
  check("phone")
    .optional()
    .custom((value) => {
      try {
        const phoneNumber = phoneUtil.parseAndKeepRawInput(value, "LB");
        if (!phoneUtil.isValidNumber(phoneNumber)) {
          throw new Error("Invalid phone number for Lebanon");
        }
        return true;
      } catch (error) {
        throw new Error("Invalid phone number format");
      }
    }),

  check("profileImg").optional(),
  check("role").optional(),
  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirm"),
  body("password")
    .notEmpty()
    .withMessage("You must enter new password")
    .custom(async (val, { req }) => {
      const user = await db.User.findByPk(req.params.id);
      if (!user) {
        throw new Error("There is no user for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      if (val !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [validatorMiddleware];

exports.updateLoggedUserValidator = [
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("phone")
    .optional()
    .custom((value) => {
      try {
        const phoneNumber = phoneUtil.parseAndKeepRawInput(value, "LB");
        if (!phoneUtil.isValidNumber(phoneNumber)) {
          throw new Error("Invalid phone number for Lebanon");
        }
        return true;
      } catch (error) {
        throw new Error("Invalid phone number format");
      }
    }),

  validatorMiddleware,
];
