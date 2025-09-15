const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');


const jobsHistorySchema = new mongoose.Schema({

    title: {
        type: String,
        trim: true,
        maxlength: 70,
    },

    description: {
        type: String,
        trim: true
    },
    salary: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
    },
    interviewDate: {
        type: Date,
    },
    applicationStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },

    user: {
        type: ObjectId,
        ref: "User",
        required: true
    },



}, { timestamps: true })



const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        trim: true,
        required: [true, 'first name is required'],
        maxlength: 32,
    },
    lastName: {
        type: String,
        trim: true,
        required: [true, 'last name is required'],
        maxlength: 32,
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'e-mail is required'],
        unique: true,
        lowercase: true,          //normalize email
        match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please add a valid email'
    ]
        
    },
    securityQuestions: [
    {
      question: String,
      answerHash: String, // Store hashed answer
    }
  ],
    password: {
        type: String,
        trim: true,
        required: [true, 'password is required'],
        minlength: [8, 'password must have at least (8) caracters'],
        select: false,
    },


    
    jobsHistory: [jobsHistorySchema],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    role: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

/** 
 * Virtual: passwordConfirmation 
 * - Not persisted
 * - Used only for validation
 */
userSchema.virtual('passwordConfirmation')
  .get(function () { return this._passwordConfirmation; })
  .set(function (val) { this._passwordConfirmation = val; });

/**
 * Validate password + confirmation + strength whenever password changes
 */
userSchema.pre('validate', function (next) {
  if (this.isModified('password')) {
    // Require confirmation
    if (!this._passwordConfirmation) {
      this.invalidate('passwordConfirmation', 'Please confirm your password');
    }
    // Must match
    if (this.password !== this._passwordConfirmation) {
      this.invalidate('passwordConfirmation', 'Passwords must match');
    }
    // Optional: strength policy
    const strongEnough = this.password.length >= 8
      && /[A-Za-z]/.test(this.password)
      && /\d/.test(this.password);
    if (!strongEnough) {
      this.invalidate('password', 'Use 8+ chars with letters and numbers');
    }
  }
  next();

});


// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare user password
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Return a JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// method to generate token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// hide sensitive fields from API response
userSchema.set('toJSON', {
  virtuals: true,     // optional
  versionKey: false,  // optional
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  }
});


module.exports = mongoose.model('User', userSchema);