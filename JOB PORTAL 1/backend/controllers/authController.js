const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');
const sendEmail = require("../utils/sendEmail"); // email password reset link
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, passwordConfirmation, } = req.body;

    // Basic presence checks
    if (!email) return next(new ErrorResponse('Email is required', 400));
    if (!password) return next(new ErrorResponse('Password is required', 400));
   

    // Match check
    if (!passwordConfirmation) {
      return next(new ErrorResponse('Please confirm your password', 400));
    }
    if (password !== passwordConfirmation) {
      return next(new ErrorResponse('Passwords must match', 400));
    }

    // Strength policy (adjust to your needs)
    const strongEnough =
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password);
    if (!strongEnough) {
      return next(
        new ErrorResponse('Use 8+ chars with letters and numbers', 400)
      );
    }

    // Normalize email
    const normalizedEmail = String(email || '').trim().toLowerCase();


    // Unique email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return next(new ErrorResponse('E-mail already registered', 409));
    }

    // Create user (do NOT persist passwordConfirmation)
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      passwordConfirmation, //triggers virtual check: not persisted
    });

    // return token 
    await sendTokenResponse(user, 201, res);
    res.status(201).json({
      success: true,
      user
    });



  } catch (error) {
    next(error);
  }
};




exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    // Create token (optional)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Option A: also set a cookie because your /api/me middleware reads tokens from cookies
   res.cookie('token', token, {
     httpOnly: true,
     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
     secure: process.env.NODE_ENV === 'production',

     maxAge: 7 * 24 * 60 * 60 * 1000
   });
 
   res.json({
    token,
    user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // <-- Make sure this is included!
      }
    });
  } catch (err) {
    console.error('signin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    // Always return 200 (don’t reveal existence of accounts)
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // await sendEmail({ to: user.email, subject: 'Password reset', text: `Reset link: ${resetURL}` });

    return res.status(200).json({
      success: true,
      message: 'Reset instructions sent.',
      // For dev only; remove in production:
      resetURL: process.env.NODE_ENV !== 'production' ? resetURL : undefined,
    });
  } catch (err) {
    next(err);
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, passwordConfirmation } = req.body || {};
    if (!password || !passwordConfirmation) {
      return next(new ErrorResponse('Password and confirmation are required', 400));
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    // Set new password and confirm; model hooks will validate + hash
    user.password = password;
    user.passwordConfirmation = passwordConfirmation; // <-- triggers your virtual validation
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

const sendTokenResponse = async (user, codeStatus, res) => {
  const token = await user.getJwtToken();
  res
    .status(codeStatus)
    .cookie('token', token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      // secure: true,
      // sameSite: 'lax',
    })
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // <-- Make sure this is included!
      }
    });
};


// log out
exports.logout = (req, res, next) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: "logged out"
    })
}


// user profile
exports.userProfile = async (req, res, next) => {

    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
        success: true,
        user
    })
}





exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) {
      // Do NOT reveal that user doesn't exist; reply success to prevent user enumeration
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // send email (stub or real)
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Password reset',
    //   text: `Reset your password: ${resetURL}`
    // });

    // For development, you can return the URL (remove in production)
    return res.status(200).json({
      success: true,
      message: 'Reset instructions sent',
      ...(process.env.NODE_ENV !== 'production' ? { resetURL } : {})
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
      return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    const { password, passwordConfirmation } = req.body || {};
    if (!password || !passwordConfirmation) {
      return next(new ErrorResponse('Password and confirmation are required', 400));
    }
    if (password !== passwordConfirmation) {
      return next(new ErrorResponse('Passwords must match', 400));
    }

    // set new password; pre-save hook will hash
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // decide: auto-login or simple success
    // Option A (simple):
    // res.status(200).json({ success: true, message: 'Password updated' });

    // Option B (auto-login; reuse your existing helper):
    // await sendTokenResponse(user, 200, res);

    res.status(200).json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};
