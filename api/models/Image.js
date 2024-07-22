// models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  fileName: String,
  fileType: String,
  fileSize: Number,
  url: String,
});

module.exports = mongoose.model('Image', imageSchema);


