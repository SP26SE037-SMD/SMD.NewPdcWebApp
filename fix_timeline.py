import re

path = 'src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx'
with open(path, 'r') as f:
    text = f.read()

# Replace Stakeholders card
stakeholders_block = """<div className="bg-[#ffffff] rounded-2xl p-6 shadow-[0px_2px_8px_rgba(45,51,53,0.08)]">
                  <h4 className="text-sm font-bold text-[#2d3335] mb-4 uppercase tracking-wider">Stakeholders</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#b1f0ce] flex items-center justify-center text-[#1d5c42]"><span className="material-symbols-outlined text-sm">person</span></div>
                      <div>
                        <p className="text-sm font-bold">HoCFDC</p>
                        <p className="text-[10px] text-[#5a6062] uppercase">Creator</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1d5c42] flex items-center justify-center text-[#ffffff]"><span className="material-symbols-outlined text-sm">verified_user</span></div>
                      <div>
                        <p className="text-sm font-bold">Vice Principal</p>
                        <p className="text-[10px] text-[#5a6062] uppercase">Approver</p>
                      </div>
                    </div>
                  </div>
                </div>"""

text = re.sub(r'<div className="bg-\[#ffffff\] rounded-2xl p-6 border border-\[#dee3e6\] shadow-sm">\s*<h4 className="text-sm font-bold text-\[#2d3335\] mb-4 uppercase tracking-wider">\s*Stakeholders.*?<\/ul>\s*<\/section>', '', text, flags=re.DOTALL)
text = re.sub(r'<section className="bg-white rounded-2xl p-6 border border-\[#dee3e6\] shadow-sm">\s*<h4 className="text-sm font-bold text-\[#2d3335\] mb-4 uppercase tracking-wider">\s*Stakeholders.*?<\/ul>\s*<\/section>', '', text, flags=re.DOTALL)

# In the secondary column block, I might have output other stakeholders
# "div className="lg:col-span-4"..."
# Let's just remove the fake timeline
text = re.sub(r'<div className="bg-white rounded-2xl p-6 border border-\[#2d6a4f\]\/10">\s*<h4 className="text-sm font-bold text-\[#2d3335\] mb-4">\s*Review Timeline.*?<\/ul>\s*<\/div>', '', text, flags=re.DOTALL)

text = re.sub(r'<div className="bg-\[#ffffff\] rounded-2xl p-6 shadow-\[0px_2px_8px_rgba\(45,51,53,0\.08\)\]">\s*<h4 className="text-sm font-bold text-\[#2d3335\] mb-4 uppercase tracking-wider">\s*Stakeholders.*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>', stakeholders_block, text, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(text)
print("Done fixing timeline")
