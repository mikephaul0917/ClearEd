const fs = require('fs');
const path = require('path');

const cardPath = path.join(__dirname, 'frontend/src/components/stream/ClearanceRequirementCard.tsx');
let dt = fs.readFileSync(cardPath, 'utf8');

dt = dt.replace('{stats?.pending || 0}', '{stats?.approved || 0}');
dt = dt.replace('{(stats?.pending || 0) + (stats?.approved || 0) + (stats?.rejected || 0) || 0}', '{(stats?.totalMembers || 0) - (stats?.approved || 0)}');

fs.writeFileSync(cardPath, dt);
console.log('Done ClearanceRequirementCard');

const detailPath = path.join(__dirname, 'frontend/src/pages/stream/RequirementDetailsPage.tsx');
let dt2 = fs.readFileSync(detailPath, 'utf8');
dt2 = dt2.replace(
    "{submissions.filter(s => s.status === 'pending' || s.status === 'approved' || s.status === 'resubmission_required').length}",
    "{submissions.filter(s => s.status === 'approved').length}"
);

dt2 = dt2.replace(
    "{membership?.totalMembers || submissions.length || 0}",
    "{(membership?.totalMembers || submissions.length || 0) - submissions.filter(s => s.status === 'approved').length}"
);

fs.writeFileSync(detailPath, dt2);
console.log('Done RequirementDetailsPage');
