const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed to download image'));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => resolve());
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function runFlow() {
  const serverUrl = 'http://localhost:5000';
  let imagePath = path.join(__dirname, 'test-image.jpg');
  
  try {
    console.log('1. Checking backend connectivity...');
    try {
      await fetch(`${serverUrl}/api/products`);
      console.log('   Backend is running!');
    } catch (e) {
      console.log('   ⚠️ Backend not running on port 5000.');
      console.log('   Starting local server temporarily for the test...');
      
      // Attempt to require server.js to boot it up
      require('./server.js');
      // Wait for server and DB to initialize
      await new Promise(res => setTimeout(res, 5000));
    }

    console.log('\n2. Downloading a realistic product image for the test...');
    // A nice placeholder product image from Unsplash
    await downloadImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', imagePath);
    console.log('   Downloaded test image to use for the upload.');

    console.log('\n3. Authenticating as Admin (ritikamishra707@gmail.com)...');
    const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ritikamishra707@gmail.com',
        password: 'Ankitmishra1@'
      })
    });
    
    if (!loginRes.ok) {
        throw new Error('Login failed: ' + await loginRes.text());
    }
    const loginData = await loginRes.json();
    const token = loginData.accessToken || loginData.token;
    console.log('   Login successful! JWT token acquired.');

    console.log('\n4. Simulating frontend Form POST to upload image directly to Cloudinary...');
    const formData = new FormData();
    const buf = fs.readFileSync(imagePath);
    const blob = new Blob([buf], { type: 'image/jpeg' });
    formData.append('image', blob, 'test-image.jpg');

    const uploadRes = await fetch(`${serverUrl}/api/admin/products/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error('Upload API failed: ' + JSON.stringify(uploadData));
    }
    
    console.log('\n🎉 SUCCESS! Upload Flow Is Working Perfectly.');
    console.log('👉 Cloudinary Image URL that would be saved to DB:');
    console.log('   ' + uploadData.url);

  } catch (err) {
    console.error('\n❌ Error during test flow:', err.message);
  } finally {
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
    process.exit(0);
  }
}

runFlow();
