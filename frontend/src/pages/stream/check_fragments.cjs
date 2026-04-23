
const fs = require('fs');
const content = fs.readFileSync('c:/Users/phaul/Documents/CS PROJECTS/E-CLEARANCE/frontend/src/pages/stream/RequirementDetailsPage.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('<>')) console.log(`Open <> at line ${index + 1}`);
    if (line.includes('</>')) console.log(`Close </> at line ${index + 1}`);
});
