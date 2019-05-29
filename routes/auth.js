const express = require('express');
const { check, body } = require('express-validator/check');
const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),

    body('password', 'Password must contain more than 8 characters')
      .isLength({
        min: 8,
      })
      .trim(),
  ],
  authController.postLogin,
);

router.post('/logout', authController.postLogout);
router.get('/signup', authController.getSignup);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ where: { email: value } }).then(user => {
          if (user) {
            return Promise.reject('Email already exists');
          }
          return true;
        });
      })
      .normalizeEmail(),
    body('password', 'Please enter a password with minimum length of 8')
      .isLength({ min: 8 })
      .custom((value, { req }) => {
        if (value === 'password') {
          throw new Error("Please don't use password as your password...");
        }
        return true;
      })
      .trim(),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords must match');
        }
        return true;
      })
      .trim(),
  ],
  authController.postSignup,
);

router.get('/reset', authController.getReset);
router.post(
  '/reset',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ where: { email: value } }).then(user => {
          if (!user) {
            return Promise.reject(
              'Email does not exist. Please enter a valid email',
            );
          }
          return true;
        });
      })
      .normalizeEmail(),
  ],
  authController.postReset,
);
router.get('/reset/:token', authController.getNewPassword);
router.post(
  '/new-password',
  body('password', 'Please enter a password with minimum length of 8')
    .isLength({ min: 8 })
    .custom((value, { req }) => {
      if (value === 'password') {
        throw new Error("Please don't use password as your password... Again");
      }
      return true;
    })
    .trim(),
  authController.postNewPassword,
);

module.exports = router;
