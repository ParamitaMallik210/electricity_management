const mongoose = require('mongoose')
const dbconnect = require('../db')

//Call the db to connect the mongo db
dbconnect()

// Complaint Schema
const ComplaintSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    contact: {
        type: String
    },
    desc: {
        type: String
    },
    rollNumber: {
        type: String
    },
    photoId: mongoose.Schema.Types.ObjectId,  // Reference to GridFS file
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Complaint = module.exports = mongoose.model('Complaint', ComplaintSchema);

module.exports.registerComplaint = function (newComplaint, callback) {
    newComplaint.save(callback);
}

module.exports.getAllComplaints = function(callback){
    Complaint.find(callback);
  }