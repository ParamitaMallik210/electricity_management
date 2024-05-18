const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const mongoose = require('mongoose');
const path = require('path');
const { check, validationResult } = require('express-validator');

let User = require('../models/user');
let Complaint = require('../models/complaint');
let ComplaintMapping = require('../models/complaint-mapping');

const mongoURI = 'mongodb+srv://tinamallik21:x8vuUzPp5CmtIsRN@cluster0.9335bzc.mongodb.net/yourDatabaseName?retryWrites=true&w=majority';

const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

let gfs;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage: storage });

// Home Page - Dashboard
router.get('/', ensureAuthenticated, (req, res) => {
    res.render('index');
});

// Login Form
router.get('/login', (req, res) => {
    res.render('login');
});

// Register Form
router.get('/register', (req, res) => {
    res.render('register');
});

// Logout
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
});

// Admin
router.get('/admin', ensureAuthenticated, (req, res) => {
    Complaint.getAllComplaints((err, complaints) => {
        if (err) throw err;
    
        User.getEngineer((err, engineer) => {
            if (err) throw err;

            res.render('admin/admin', {
                complaints: complaints,
                engineer: engineer,
            });
        });
    });
});

// Assign the Complaint to Engineer
router.post('/assign', [
    check('complaintID').notEmpty().withMessage('Complaint ID is required'),
    check('engineerName').notEmpty().withMessage('Engineer Name is required')
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).render('admin/admin', { errors: errors.array() });
    }

    const { complaintID, engineerName } = req.body;
    const newComplaintMapping = new ComplaintMapping({ complaintID, engineerName });

    newComplaintMapping.save((err) => {
        if (err) throw err;
        req.flash('success_msg', 'Complaint successfully assigned to Engineer');
        res.redirect('/admin');
    });
});

// Junior Eng
router.get('/jeng', ensureAuthenticated, (req, res) => {
    res.render('junior/junior');
});

// Complaint
router.get('/complaint', ensureAuthenticated, (req, res) => {
    res.render('complaint', {
        username: req.session.user,
    });
});

// Register a Complaint
router.post('/registerComplaint', upload.single('photo'), [
    check('contact').notEmpty().withMessage('Contact field is required'),
    check('desc').notEmpty().withMessage('Description field is required')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).render('complaint', { errors: errors.array() });
    }

    try {
        const { name, email, contact, desc, rollNumber } = req.body;
        const photoId = req.file.id;

        const complaint = new Complaint({ name, email, contact, desc, rollNumber, photoId });

        await complaint.save();
        req.flash('success_msg', 'Complaint registered successfully!');
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error registering complaint: ' + error.message);
    }
});

// Process Register
router.post('/register', [
    check('name').notEmpty().withMessage('Name field is required'),
    check('email').notEmpty().withMessage('Email field is required').isEmail().withMessage('Email must be a valid email address'),
    check('username').notEmpty().withMessage('Username field is required'),
    check('password').notEmpty().withMessage('Password field is required'),
    check('password2').equals('password').withMessage('Passwords do not match'),
    check('role').notEmpty().withMessage('Role option is required')
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('register', {
            errors: errors.array()
        });
    }

    const { name, username, email, password, role } = req.body;
    const newUser = new User({ name, username, email, password, role });

    User.registerUser(newUser, (err) => {
        if (err) throw err;
        req.flash('success_msg', 'You are Successfully Registered and can Log in');
        res.redirect('/login');
    });
});

// Local Strategy
passport.use(new LocalStrategy((username, password, done) => {
    User.getUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            return done(null, false, {
                message: 'No user found'
            });
        }

        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, {
                    message: 'Wrong Password'
                });
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    const sessionUser = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
    };
    done(null, sessionUser);
});

passport.deserializeUser((id, done) => {
    User.getUserById(id, (err, sessionUser) => {
        done(err, sessionUser);
    });
});

// Login Processing
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res, next) => {
    req.session.save((err) => {
        if (err) {
            return next(err);
        }
        if (req.user.role === 'admin') {
            res.redirect('/admin');
        } else if (req.user.role === 'jeng') {
            res.redirect('/jeng');
        } else {
            res.redirect('/');
        }
    });
});

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You are not Authorized to view this page');
        res.redirect('/login');
    }
}

module.exports = router;
