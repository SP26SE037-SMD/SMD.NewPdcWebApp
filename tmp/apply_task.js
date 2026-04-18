const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/manage-majors-content.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add Task State
const stateInsertionMarker = 'const [createError, setCreateError] = useState("");';
const taskFormState = `
  const [taskForm, setTaskForm] = useState({
    deadline: "",
    type: "REVIEW",
    priority: "HIGH",
  });
`;
data = data.replace(stateInsertionMarker, stateInsertionMarker + '\n' + taskFormState);

// 2. Update Mutation
const oldMutation = `      // 3. Update status
      if (finalMajorId) {
        await MajorService.updateMajorStatus(finalMajorId, "INTERNAL_REVIEW");
      }
      
      return finalMajorId;`;

const newMutation = `      // 3. Update status
      if (finalMajorId) {
        await MajorService.updateMajorStatus(finalMajorId, "INTERNAL_REVIEW");
      }
      
      // 4. Create Task
      if (finalMajorId) {
        let actualDeadline = taskForm.deadline;
        if (!actualDeadline) {
          actualDeadline = new Date().toISOString().split("T")[0]; // fallback to today
        }
        await fetch("/api/tasks/byVP", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: "a7e97b05-4fce-4f65-9b01-bd8cafaf3a9a",
                majorId: finalMajorId,
                taskName: \`Review Major: \${newMajor.majorName}\`,
                description: \`Please review the new major \${newMajor.majorCode} - \${newMajor.majorName}.\`,
                priority: taskForm.priority,
                deadline: actualDeadline,
                type: taskForm.type
            })
        });
      }
      
      return finalMajorId;`;

data = data.replace(oldMutation, newMutation);

// 3. Update UI inside Confirmation Modal
const oldModalUI = `<div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-6 shadow-sm border border-[#4caf50]/10">
                          <Send className="text-[#4caf50] w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#2d3335] mb-3 font-['Plus_Jakarta_Sans']">
                          Confirm Submission
                        </h2>
                        <p className="text-[#5a6062] leading-relaxed px-4 text-sm font-medium">
                          Are you sure you want to submit the{" "}
                          <span className="font-bold text-[#2d3335]">
                            {newMajor.majorName}
                          </span>{" "}
                          curriculum? Once submitted, it will be sent to the
                          department head for review.
                        </p>
                      </div>

                      <div className="px-8 py-4 mx-8 bg-[#f1f4f5] rounded-xl mb-8 border border-[#adb3b5]/10">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#5a6062] font-bold uppercase tracking-widest">
                            Major Code
                          </span>
                          <span className="font-bold text-[#2d3335]">
                            {newMajor.majorCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#5a6062] font-bold uppercase tracking-widest">
                            Outcomes Count
                          </span>
                          <span className="text-[#4caf50] font-bold">
                            {stagedPOs.length} Established
                          </span>
                        </div>
                      </div>`;

const newModalUI = `<div className="px-8 pt-8 pb-4 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-4 shadow-sm border border-[#4caf50]/10">
                          <Send className="text-[#4caf50] w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#2d3335] mb-2 font-['Plus_Jakarta_Sans']">
                          Confirm & Create Task
                        </h2>
                        <p className="text-[#5a6062] leading-relaxed px-4 text-xs font-medium">
                          Submit this major and assign a review task.
                        </p>
                      </div>

                      <div className="px-8 flex flex-col gap-4 mb-8">
                        <div>
                           <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6062] mb-1">
                             Task Deadline
                           </label>
                           <input
                             type="date"
                             required
                             value={taskForm.deadline}
                             onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                             className="w-full bg-[#f1f4f5] border border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-2 text-[#2d3335] text-sm outline-none transition-all"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6062] mb-1">
                               Priority
                             </label>
                             <select
                               value={taskForm.priority}
                               onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                               className="w-full bg-[#f1f4f5] border border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-2 text-[#2d3335] text-sm outline-none transition-all appearance-none"
                             >
                               <option value="HIGH">High</option>
                               <option value="MEDIUM">Medium</option>
                               <option value="LOW">Low</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6062] mb-1">
                               Type
                             </label>
                             <select
                               value={taskForm.type}
                               onChange={(e) => setTaskForm({...taskForm, type: e.target.value})}
                               className="w-full bg-[#f1f4f5] border border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-2 text-[#2d3335] text-sm outline-none transition-all appearance-none"
                             >
                               <option value="REVIEW">Review</option>
                               <option value="ENACTMENT">Enactment</option>
                               <option value="EXPERTISE">Expertise</option>
                             </select>
                           </div>
                        </div>
                      </div>`;

data = data.replace(oldModalUI, newModalUI);

fs.writeFileSync(file, data);
console.log('Done');
