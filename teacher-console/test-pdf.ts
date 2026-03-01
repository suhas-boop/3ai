import fs from 'fs';
const pdfParse = require('pdf-parse');

async function main() {
    const pdfBuffer = fs.readFileSync('test.pdf');
    try {
        const data = await pdfParse(pdfBuffer);
        console.log("Success! Characters:", data.text.length);
    } catch (e) {
        console.error("Extraction error:", e);
    }
}
main();
