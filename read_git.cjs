const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('git log -p -n 5 src/App.tsx').toString();
  fs.writeFileSync('git_history.txt', result);
  console.log("Git history saved");
} catch (e) {
  console.error("Error writing git history", e);
}
