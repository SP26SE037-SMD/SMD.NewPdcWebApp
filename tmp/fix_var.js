const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/manage-majors-content.tsx';
let data = fs.readFileSync(file, 'utf8');

// remove one of them
const t = `
  const [taskForm, setTaskForm] = useState({
    deadline: "",
    type: "REVIEW",
    priority: "HIGH",
  });
`;
const firstIndex = data.indexOf(t);
if(firstIndex !== -1) {
    const secondIndex = data.indexOf(t, firstIndex + 1);
    if(secondIndex !== -1) {
        data = data.substring(0, secondIndex) + data.substring(secondIndex + t.length);
    }
}

fs.writeFileSync(file, data);
console.log("Fixed duplicates");
