const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = '/Users/yehyeok/Desktop/Dev/blog/frontend/public/images/posts/claude-code-rewind';

['context-window', 'rewind-menu', 'rewind-options'].forEach(name => {
  const input = path.join(dir, `${name}.png`);
  const output = path.join(dir, `${name}.webp`);
  
  sharp(input)
    .webp()
    .toFile(output)
    .then(() => {
      fs.unlinkSync(input);
      console.log(`Converted ${name}`);
    })
    .catch(err => console.error(err));
});
