const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;
    const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            },
            {
              text: "Extract only medication text and write there name with comma"
            }
          ]
        }
      ]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    fs.unlinkSync(imagePath); // cleanup

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No text extracted.";
    res.json({ extractedText });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: 'Text extraction failed.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
