const fs = require('fs');

const path = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx';
let data = fs.readFileSync(path, 'utf8');

// 1. Add Tab button
const btnOld = `                                        {activeTab === "structure" && (
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
                                        )}
                                </button>
                        </div>`;

const btnNew = `                                        {activeTab === "structure" && (
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
                                        )}
                                </button>
                                <button
                                        onClick={() => setActiveTab("review")}
                                        className={\`pb-4 font-semibold transition-colors relative \${activeTab === "review" ? "text-[#2d6a4f] font-bold" : "text-[#5a6062] hover:text-[#2d6a4f]"}\`}
                                >
                                        Final Review
                                        {activeTab === "review" && (
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
                                        )}
                                </button>
                        </div>`;

data = data.replace(btnOld, btnNew);

// 2. Add Tab Content
const tabContentOld = `                                </div>
                        )}
                </main>
        );
}`;

const tabContentNew = `                                </div>
                        )}

                        {activeTab === "review" && (
                                <ReviewTabContent 
                                        curriculumId={id} 
                                        majorId={curriculum?.majorId} 
                                />
                        )}
                </main>
        );
}

function ReviewTabContent({ curriculumId, majorId }: { curriculumId: string, majorId: string }) {
        const queryClient = useQueryClient();
        const [comment, setComment] = React.useState("");
        const [requestId, setRequestId] = React.useState(""); // Mock request id, in reality it needs to be fetched
        const [isSubmitting, setIsSubmitting] = React.useState(false);

        const applyAction = async (status: "APPROVED" | "REJECTED") => {
                if (status === "REJECTED" && !comment.trim()) {
                        alert("Please provide a comment for rejecting");
                        return;
                }
                
                if (!requestId) {
                        const testRequestId = prompt("Enter Mock Request ID to action upon (e.g. 1234):");
                        if (!testRequestId) return;
                        setRequestId(testRequestId);
                        try {
                                setIsSubmitting(true);
                                await RequestService.updateRequest(testRequestId, {
                                        status,
                                        comment,
                                        curriculumId,
                                        majorId
                                });
                                alert(\`Request successfully \${status}\`);
                                setComment("");
                        } catch (e) {
                                console.error(e);
                                alert("Failed to update request");
                        } finally {
                                setIsSubmitting(false);
                        }
                } else {
                        try {
                                setIsSubmitting(true);
                                await RequestService.updateRequest(requestId, {
                                        status,
                                        comment,
                                        curriculumId,
                                        majorId
                                });
                                alert(\`Request successfully \${status}\`);
                                setComment("");
                        } catch (e) {
                                console.error(e);
                                alert("Failed to update request");
                        } finally {
                                setIsSubmitting(false);
                        }
                }
        };

        return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#dee3e6] max-w-4xl mx-auto mt-8">
                        <h2 className="text-2xl font-black text-[#2d3335] mb-6">Final Curriculum Decision</h2>
                        
                        <p className="text-[#5a6062] mb-6 inline-block">
                                Review the entire curriculum before proceeding. If you choose to reject, a comment must be provided detailing what needs to be changed.
                        </p>

                        <div className="mb-6">
                                <label className="block text-sm font-bold text-[#2d3335] mb-2 uppercase tracking-wide">
                                        Review Comment / Feedback
                                </label>
                                <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Add comments or specific reasons for rejection here..."
                                        className="w-full h-32 p-4 border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] text-[#2d3335] resize-none"
                                />
                        </div>

                        <div className="flex items-center gap-4">
                                <button
                                        onClick={() => applyAction("APPROVED")}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 bg-[#2d6a4f] hover:bg-[#1f4a37] text-white px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50"
                                >
                                        {isSubmitting ? "Processing..." : "Approve Curriculum"}
                                </button>
                                <button
                                        onClick={() => applyAction("REJECTED")}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 border border-red-500 text-red-600 hover:bg-red-50 px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50"
                                >
                                        {isSubmitting ? "Processing..." : "Reject & Require Changes"}
                                </button>
                        </div>
                </div>
        );
}`;

data = data.replace(tabContentOld, tabContentNew);
fs.writeFileSync(path, data);
