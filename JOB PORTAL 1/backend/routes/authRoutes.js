const express = require("express");
const router = express.Router();
const { signup, signin, logout, userProfile, forgotPassword, resetPassword } = require('../controllers/authController');
// const { forgotPassword, resetPassword } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');



//auth routes
// /api/signup
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirmation, securityQuestions } = req.body;

    const hashedQuestions = await Promise.all(
      securityQuestions.map(async q => ({
        question: q.question,
        answerHash: await bcrypt.hash(q.answer, 10),
      }))
    );

    // Create user instance
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      securityQuestions: hashedQuestions,
    });

    // Set the virtual field for validation
    user.passwordConfirmation = passwordConfirmation;

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration error", details: err.message });
  }
});
// /api/signin
router.post('/signin', signin);
// /api/logout
router.get('/logout', logout);
// /api/me
router.get('/me', isAuthenticated, userProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/forgot-password-questions', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ questions: user.securityQuestions.map(q => q.question) });
});
router.post('/verify-security-answers', async (req, res) => {
  const { email, answers } = req.body; // answers: ['a1', 'a2', 'a3']
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let correct = 0;
  for (let i = 0; i < user.securityQuestions.length; i++) {
    if (await bcrypt.compare(answers[i], user.securityQuestions[i].answerHash)) {
      correct++;
    }
  }
  if (correct >= 2) {
    // Generate a short-lived token for password reset
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });
    return res.json({ success: true, resetToken });
  } else {
    return res.status(401).json({ success: false, message: 'Not enough correct answers' });
  }
});
router.post('/reset-password-with-questions', async (req, res) => {
  const { resetToken, newPassword, passwordConfirmation } = req.body;
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Set password and virtual for confirmation
    user.password = newPassword;
    user.passwordConfirmation = passwordConfirmation;

    await user.save();
    res.json({ message: 'Password has been reset' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});


module.exports = router;