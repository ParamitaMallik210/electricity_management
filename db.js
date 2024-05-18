// const mongoose = require('mongoose')

// function connect () {
//     mongoose.set('useCreateIndex', true);
//     mongoose.connect('mongodb+srv://tinamallik21:x8vuUzPp5CmtIsRN@cluster0.9335bzc.mongodb.net/',{useNewUrlParser: true})
// }

// module.exports = connect
const mongoose = require('mongoose');

function connect() {
    // Set mongoose options
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);  // Added to use the new Server Discovery and Monitoring engine

    // Define the connection string with the database name
    const uri = 'mongodb+srv://tinamallik21:x8vuUzPp5CmtIsRN@cluster0.9335bzc.mongodb.net/yourDatabaseName?retryWrites=true&w=majority';

    // Connect to MongoDB
    mongoose.connect(uri, { useNewUrlParser: true })
        .then(() => console.log('MongoDB connected successfully'))
        .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = connect;
