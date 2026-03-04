const { spawn } = require('child_process');
const path = require('path');

const generateHoroscope = (birthData) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../python/horoscope_engine.py');
    const args = JSON.stringify(birthData);
    const process = spawn('python', [scriptPath, args]);

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', data => { output += data.toString(); });
    process.stderr.on('data', data => { errorOutput += data.toString(); });

    process.on('close', code => {
      if (code !== 0) return reject(new Error(errorOutput));
      try {
        const result = JSON.parse(output);
        if (!result.success) return reject(new Error(result.error));
        resolve(result.data);
      } catch (e) {
        reject(new Error('Failed to parse horoscope output'));
      }
    });

    setTimeout(() => {
      process.kill();
      reject(new Error('Horoscope calculation timed out'));
    }, 10000);
  });
};

module.exports = { generateHoroscope };