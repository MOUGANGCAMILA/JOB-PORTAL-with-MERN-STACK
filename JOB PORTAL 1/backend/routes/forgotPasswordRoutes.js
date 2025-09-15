const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('./models/User'); // adjust path
const bcrypt = require('bcrypt');

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    const mailOptions = {
      from: process.env.SMTP_FROM,      
      to: user.email,
      subject: 'Password Reset',
      text: `Reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.send('Reset link sent');
  } catch (err) {
    console.error('Error sending reset email:', err);
    res.status(500).send('Error sending reset email');
  }
});

app.post('/api/forgot-password-questions', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send('User not found');
  // Only send questions, not answers!
  res.json({ questions: user.securityQuestions.map(q => q.question) });
});

app.post('/api/verify-security-answers', async (req, res) => {
  const { email, answers } = req.body;
  // answers: ['answer1', 'answer2', 'answer3']
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send('User not found');
  let correct = 0;
  for (let i = 0; i < user.securityQuestions.length; i++) {
    if (await bcrypt.compare(answers[i], user.securityQuestions[i].answerHash)) {
      correct++;
    }
  }
  if (correct >= 2) {
    // Optionally, generate a short-lived token for password reset
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Not enough correct answers' });
  }
});

app.post('/api/reset-password-with-questions', async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send('User not found');
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.send('Password has been reset');
});