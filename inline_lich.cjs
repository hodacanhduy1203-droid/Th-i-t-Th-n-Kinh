const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

const lichFile = fs.readFileSync('src/components/Tabs/LichBatQuaiTab.tsx', 'utf-8');

// Extract the content inside return ( <React.Fragment> ... </React.Fragment> )
const startIndex = lichFile.indexOf('<React.Fragment>');
const endIndex = lichFile.lastIndexOf('</React.Fragment>') + '</React.Fragment>'.length;

const lichContent = lichFile.substring(startIndex, endIndex);

// Replace the <LichBatQuaiTab ... /> in App.tsx
const appStart = app.indexOf('<LichBatQuaiTab');
const appEnd = app.indexOf('/>\n\t\t\t\t)}', appStart) + '/>'.length;

if (appStart > -1 && appEnd > appStart) {
    const newApp = app.substring(0, appStart) + lichContent + app.substring(appEnd);
    fs.writeFileSync('src/App.tsx', newApp);
    console.log("Successfully inlined LichBatQuaiTab");
} else {
    console.log("Could not find LichBatQuaiTab in App.tsx");
}
