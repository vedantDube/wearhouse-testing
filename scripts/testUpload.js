(async () => {
  try {
    console.log('Testing unified API endpoint...');
    
    // Create a dummy text file to act as our upload blob
    const dummyContent = "This is a test upload file.";
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', blob, 'test-script-upload.txt');
    formData.append('type', 'RECEIVER_REJECTION');
    formData.append('awb', 'CLI-TEST-AWB');
    
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    console.log('Upload API Response:', data);
  } catch (error) {
    console.error('Test failed. Make sure your local server is running on port 3000.', error);
  }
})();