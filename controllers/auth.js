const User = require('../models/user');

const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');
exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      loginEmail: '',
      loginPassword: '',
    },
    valErrors: [],
  });
};
exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'SignUp',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    valErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: { loginEmail, loginPassword },
      valErrors: errors.array(),
    });
  }
  User.findOne({ where: { email: loginEmail } })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid login credentials',
          oldInput: { loginEmail, loginPassword },
          valErrors: errors.array(),
        });
      }
      bcrypt
        .compare(loginPassword, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            user.createCart();
            return res.redirect('/');
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid login credentials',
            oldInput: { loginEmail, loginPassword },
            valErrors: errors.array(),
          });
        })
        .catch(err => {
          req.flash('error', 'Something went wrong');
          res.redirect('/login');
        });
    })
    .catch(console.log);
};
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      valErrors: errors.array(),
    });
  }
  bcrypt.hash(password, 12).then(hashedPassword => {
    return User.create({ email, password: hashedPassword }).then(result => {
      res.redirect('/login');
    });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/resetPassword', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
    oldInput: {email: ""},
    valErrors: [],

  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/resetPassword', {
      path: '/reset',
      pageTitle: 'Reset Password',
      errorMessage: errors.array()[0].msg,
      oldInput: { email },
      valErrors: errors.array(),
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('reset');
    }
    const token = buffer.toString('hex');
    resetToken = token;
    resetTokenExpiration = Date.now() + 3600000;
    User.update(
      {
        resetToken: resetToken,
        resetTokenExpiration: resetTokenExpiration,
      },
      { where: { email: email } },
    )
      .then(result => {
        res.redirect(`/reset/${resetToken}`);
    
      })
      .catch(console.log);
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ where: { resetToken: token } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/newPassword', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user.id.toString(),
        passwordToken: token,
        oldInput: { newPassword:""},
        valErrors: [],

      });
    })
    .catch(console.log);
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const passwordToken = req.body.passwordToken;
  const userId = req.body.userId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/newPassword', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: errors.array()[0].msg,
      userId: userId,
        passwordToken: passwordToken,
      oldInput: { newPassword},
      valErrors: errors.array(),
    });
  }
  bcrypt
    .hash(newPassword, 12)
    .then(hashedPassword => {
      User.update(
        {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiration: { $gt: Date.now() },
        },
        { where: { id: userId, resetToken: passwordToken } },
      );
    })
    .then(result => res.redirect('login'))
    .catch(console.log);
};
