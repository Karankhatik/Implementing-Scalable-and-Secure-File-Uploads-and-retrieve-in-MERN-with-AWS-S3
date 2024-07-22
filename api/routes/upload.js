// server/routes/upload.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Image = require('../models/Image');



// Configure AWS
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware to check if user is verified
const isAuthenticated = (req, res, next) => {
  // your authentication logic here 
  next();
};

router.post('/generate-presigned-url', isAuthenticated, async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'uploads/' + fileName,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    const newImage = new Image({
      fileName,
      fileType,
      fileSize,
      url: presignedUrl,
    });

    await newImage.save();

    res.json({ presignedUrl, url: presignedUrl });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    res.status(500).send('Server Error');
  }
});

// Route to get the image
router.get('/image/:fileName', isAuthenticated, async (req, res) => {
  const { fileName } = req.params;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'uploads/' + fileName,
    });

    const data = await s3Client.send(command);

    // Set the correct content-type header
    res.setHeader('Content-Type', data.ContentType);

    // Stream the S3 data to the response
    data.Body.pipe(res);
  } catch (err) {
    console.error('Error getting the image:', err);
    res.status(500).send('Server Error');
  }
});



module.exports = router;
