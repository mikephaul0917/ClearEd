const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/student/StudentClearanceSlip.tsx',
    'src/pages/student/StudentCertificate.tsx',
    'src/pages/public/VerifyInstitution.tsx',
    'src/pages/public/RequestInstitutionAccess.tsx',
    'src/components/student/ClearanceRequirements.tsx',
    'src/components/officer/OfficerReviewSimple.tsx',
    'src/components/GlobalAnnouncements.tsx',
    'src/components/dean/DeanApprovalsSimple.tsx',
    'src/components/admin/ClearanceManagement.tsx',
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/import\s+\{\s*api\s*\}\s+from\s+['"]\.\.\/\.\.\/api['"];/g, "import { api } from '../../services';");
        content = content.replace(/import\s+\{\s*api\s*\}\s+from\s+['"]\.\.\/api['"];/g, "import { api } from '../services';");
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    } else {
        console.log(`Not found: ${file}`);
    }
});
