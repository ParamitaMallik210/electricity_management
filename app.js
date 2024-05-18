const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const indexRouter = require('./routes/index');
const { GridFsStorage } = require('multer-gridfs-storage');  // Add this line
const multer = require('multer');  // Ensure multer is imported

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://tinamallik21:x8vuUzPp5CmtIsRN@cluster0.9335bzc.mongodb.net/yourDatabaseName?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Connection error', error);
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up GridFS storage
const storage = new GridFsStorage({
    url: 'mongodb+srv://tinamallik21:x8vuUzPp5CmtIsRN@cluster0.9335bzc.mongodb.net/yourDatabaseName?retryWrites=true&w=majority',
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

const upload = multer({ storage });  // Ensure multer is configured correctly

// Set up routes
app.use('/', indexRouter);

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'form.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
