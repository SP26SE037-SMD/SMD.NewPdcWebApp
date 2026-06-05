import re

with open('layout_block_v2.tsx', 'r') as f:
    content = f.read()

# Replace the flex row wrapper to a column wrapper
content = content.replace(
    '<div className="mt-5 flex flex-col xl:flex-row gap-8 items-start">',
    '<div className="mt-5 flex flex-col gap-8">'
)

# SECTIONS PANEL wrapper -> Top Tabs container
content = content.replace(
    '<div className="xl:w-[35%] w-full flex flex-col gap-6 sticky top-6">',
    '<div className="w-full flex flex-col gap-4">'
)

# Header and Tabs rendering
old_section_header = """<div>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/70 flex items-center gap-2">
                            <ListTree className="h-4 w-4 text-primary/70" />
                            Sections List
                          </h3>
                          {schema?.sections?.length ? (
                            <span className="rounded-lg bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface-variant border border-outline/5">
                              {schema.sections.length} sections
                            </span>
                          ) : null}
                        </div>

                        {loadingSchema ? (
                          <div className="flex items-center justify-center gap-2 py-12 text-sm font-medium text-on-surface-variant">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Loading form sections...
                          </div>
                        ) : schema?.sections?.length ? (
                          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {schema.sections.map((section, index) => {
                              const isActive =
                                selectedSectionId === section.sectionId;
                              const questionCount =
                                section.questions?.length || 0;

                              return (
                                <div
                                  key={section.sectionId}
                                  className={`group rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                                    isActive
                                      ? "bg-white shadow-sm ring-1 ring-primary/20 translate-x-1"
                                      : "bg-transparent hover:bg-white/60 hover:translate-x-0.5"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <button
                                      onClick={() =>
                                        setSelectedSectionId(section.sectionId)
                                      }
                                      className="flex-1 text-left"
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                            isActive
                                              ? "bg-primary text-white"
                                              : "bg-primary/10 text-primary"
                                          }`}
                                        >
                                          Section {index + 1}
                                        </span>
                                        <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary border border-secondary/10">
                                          Action:{" "}
                                          {section.actionAfter ||
                                            section.afterSectionAction ||
                                            "NEXT"}
                                        </span>
                                      </div>
                                      <h4
                                        className={`mt-2 text-sm font-bold transition-colors ${
                                          isActive
                                            ? "text-primary"
                                            : "text-on-surface"
                                        }`}
                                      >
                                        {section.title || "Untitled section"}
                                      </h4>
                                      <p className="mt-1 text-xs text-on-surface-variant/70 font-medium">
                                        Contains {questionCount} question(s)
                                      </p>
                                    </button>

                                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() =>
                                          handleEditSection(section)
                                        }
                                        className="rounded-lg border border-outline/20 p-2 text-on-surface-variant transition bg-white/50 hover:bg-white hover:text-primary hover:border-primary/30"
                                        title="Edit section"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteSection(section.sectionId)
                                        }
                                        className="rounded-lg border border-error/20 p-2 text-error transition bg-white/50 hover:bg-error/10 hover:border-error/30"
                                        title="Delete section"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-outline/25 py-12 text-center text-on-surface-variant/80 bg-white/30">
                            <ClipboardList className="h-8 w-8 text-outline/50 mx-auto mb-2" />
                            <p className="text-sm font-semibold">
                              No sections found
                            </p>
                            <p className="text-xs mt-1 text-on-surface-variant/60">
                              Add a new section below to get started.
                            </p>
                          </div>
                        )}
                      </div>"""

new_section_header = """<div>
                        {loadingSchema ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-on-surface-variant">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Loading sections...
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {schema?.sections?.map((section, index) => {
                              const isActive = selectedSectionId === section.sectionId;
                              return (
                                <div key={section.sectionId} className="flex items-center">
                                  <button
                                    onClick={() => setSelectedSectionId(section.sectionId)}
                                    className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                                      isActive
                                        ? "bg-primary text-white shadow-md ring-2 ring-primary/20"
                                        : "bg-surface-container/50 text-on-surface-variant hover:bg-surface-container"
                                    }`}
                                  >
                                    <span>{index + 1}. {section.title || "Untitled section"}</span>
                                    {isActive && (
                                      <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
                                        <span
                                          onClick={(e) => { e.stopPropagation(); handleEditSection(section); }}
                                          className="p-1 hover:bg-white/20 rounded-md transition"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </span>
                                        <span
                                          onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.sectionId); }}
                                          className="p-1 hover:bg-white/20 rounded-md transition text-red-100 hover:text-white"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </span>
                                      </div>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              onClick={() => { resetSectionEditor(); setSectionMode("create"); }}
                              className="group flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-white/50 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/5 hover:border-primary/60"
                            >
                              <Plus className="h-4 w-4 transition group-hover:scale-110" />
                              Add Section
                            </button>
                          </div>
                        )}
                      </div>"""

content = content.replace(old_section_header, new_section_header)

# Make the section editor conditionally rendered and nicer
content = content.replace(
    '{/* Save section form editor */}',
    '{/* Save section form editor */}\n                      {(sectionMode === "edit" || (sectionMode === "create" && (!schema?.sections?.length || selectedSectionId === ""))) && ('
)
content = content.replace(
    '</div>\n                    </div>\n\n                    {/* QUESTIONS PANEL */}',
    '</div>\n                      )}\n                    </div>\n\n                    {/* QUESTIONS PANEL */}'
)

# QUESTIONS PANEL wrapper
content = content.replace(
    '<div className="xl:w-[65%] w-full flex flex-col gap-6">',
    '<div className="w-full flex flex-col gap-6 bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-outline/5 min-h-[500px]">'
)

content = content.replace(
    '<h3 className="mb-6 text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b border-outline/10 pb-4">',
    '<h3 className="mb-8 text-lg font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-4">'
)


with open('new_layout_block_v2.tsx', 'w') as f:
    f.write(content)
