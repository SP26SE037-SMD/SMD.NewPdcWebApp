"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookText, History, Trash2, Plus } from "lucide-react";
import { SourceService } from "@/services/source.service";
import { SyllabusService } from "@/services/syllabus.service";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { CreateSourceModal } from "@/components/hopdc/syllabus/CreateSourceModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";

type UnknownRecord = Record<string, unknown>;

type SourceView = {
  sourceId: string;
  sourceName: string;
  type?: string;
  author?: string;
  publisher?: string;
  publishedYear?: number;
  isbn?: string;
  url?: string;
};

function toSourceView(item: unknown): SourceView {
  const source =
    item && typeof item === "object" ? (item as UnknownRecord) : {};
  return {
    sourceId: String(source.sourceId ?? source.id ?? ""),
    sourceName: String(source.sourceName ?? source.name ?? "Unnamed source"),
    type: typeof source.type === "string" ? source.type : undefined,
    author: typeof source.author === "string" ? source.author : undefined,
    publisher:
      typeof source.publisher === "string" ? source.publisher : undefined,
    publishedYear:
      typeof source.publishedYear === "number"
        ? source.publishedYear
        : undefined,
    isbn: typeof source.isbn === "string" ? source.isbn : undefined,
    url: typeof source.url === "string" ? source.url : undefined,
  };
}

function parseSourceList(response: unknown): SourceView[] {
  const payload =
    response && typeof response === "object" ? (response as UnknownRecord) : {};
  const data = payload.data;

  if (Array.isArray(data)) {
    return data.map((item) => toSourceView(item)).filter((s) => !!s.sourceId);
  }

  if (data && typeof data === "object") {
    const dataRecord = data as UnknownRecord;
    if (Array.isArray(dataRecord.content)) {
      return dataRecord.content
        .map((item) => toSourceView(item))
        .filter((s) => !!s.sourceId);
    }
    if (Array.isArray(dataRecord.items)) {
      return dataRecord.items
        .map((item) => toSourceView(item))
        .filter((s) => !!s.sourceId);
    }
  }

  return [];
}

type SyllabusLogView = {
  logId: string;
  syllabusId: string;
  actionByFullName?: string;
  actionType?: string;
  createdAt?: string;
  note?: string;
};

function parseSyllabusLogs(response: unknown): SyllabusLogView[] {
  const payload =
    response && typeof response === "object" ? (response as UnknownRecord) : {};
  const data = payload.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      const log =
        item && typeof item === "object" ? (item as UnknownRecord) : {};
      return {
        logId: String(log.logId ?? log.id ?? ""),
        syllabusId: String(log.syllabusId ?? ""),
        actionByFullName:
          typeof log.actionByFullName === "string"
            ? log.actionByFullName
            : undefined,
        actionType:
          typeof log.actionType === "string" ? log.actionType : undefined,
        createdAt:
          typeof log.createdAt === "string" ? log.createdAt : undefined,
        note: typeof log.note === "string" ? log.note : undefined,
      };
    })
    .filter((item) => !!item.logId);
}

export const StandardInputContent = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId") || "";
  const syllabusId = searchParams.get("syllabusId") || "";

  const [isCreateSourceModalOpen, setIsCreateSourceModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState("");
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  const { data: sourceRes, isLoading: isSourcesLoading } = useQuery({
    queryKey: ["syllabus-sources", syllabusId],
    queryFn: () => SourceService.getSyllabusSources(syllabusId),
    enabled: !!syllabusId,
  });

  const { user } = useSelector((state: RootState) => state.auth);
  const accountId = user?.accountId || "";

  const { data: logRes, isLoading: isLogsLoading } = useQuery({
    queryKey: ["syllabus-action-logs", syllabusId],
    queryFn: () => SyllabusService.getSyllabusLogsBySyllabusId(syllabusId),
    enabled: !!syllabusId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      SyllabusService.updateSyllabusStatus(syllabusId, accountId, status),
    onSuccess: (res) => {
      showTimedNotice(setSourceNotice, res?.message || "Status updated.");
      queryClient.invalidateQueries({
        queryKey: ["syllabus-action-logs", syllabusId],
      });
      router.push("/dashboard/hopdc/sprint-management");
    },
    onError: (error) => {
      showTimedNotice(
        setSourceNotice,
        error instanceof Error ? error.message : "Failed to update status.",
      );
    },
  });

  const sources = useMemo(() => parseSourceList(sourceRes), [sourceRes]);
  const syllabusLogs = useMemo(() => parseSyllabusLogs(logRes), [logRes]);

  const showTimedNotice = (
    setter: (value: string) => void,
    message: string,
    ms: number = 5000,
  ) => {
    setter(message);
    setTimeout(() => setter(""), ms);
  };

  const handleCreateSourceSuccess = async () => {
    setIsCreateSourceModalOpen(false);
    await queryClient.invalidateQueries({
      queryKey: ["syllabus-sources", syllabusId],
    });
  };

  const handleDeleteSourceClick = (sourceId: string) => {
    setSourceToDelete(sourceId);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmUnlinkSource = async () => {
    if (!sourceToDelete) return;

    setDeletingSourceId(sourceToDelete);
    setIsConfirmDeleteModalOpen(false);
    try {
      const res = await SourceService.deleteSource(sourceToDelete);
      showTimedNotice(
        setSourceNotice,
        res?.message || "Source deleted successfully.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["syllabus-sources", syllabusId],
      });
    } catch (error) {
      showTimedNotice(
        setSourceNotice,
        error instanceof Error ? error.message : "Failed to delete source.",
      );
    } finally {
      setDeletingSourceId(null);
      setSourceToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <button
        onClick={() =>
          router.push(
            `/dashboard/hopdc/sprint-management/new-subject?subjectId=${subjectId}`,
          )
        }
        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#0b7a47] hover:border-emerald-200 transition-colors"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Subject Detail
      </button>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
          Syllabus Status
        </h1>
        <button
          onClick={() => updateStatusMutation.mutate("IN_PROGRESS")}
          disabled={updateStatusMutation.isPending || !accountId || !syllabusId}
          className="h-10 px-6 rounded-xl bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50 group shadow-md"
        >
          <CheckCircle
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
          {updateStatusMutation.isPending ? "Updating..." : "Completed"}
        </button>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BookText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900">
                Source Management
              </h2>
              <p className="text-base text-zinc-500">
                Manage linked sources for this syllabus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateSourceModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus size={14} />
            Create Source
          </button>
        </div>

        {sourceNotice && (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-base font-medium text-zinc-700">
            {sourceNotice}
          </p>
        )}

        {isSourcesLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
            <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-base font-medium">Loading sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 text-center">
            <BookText size={32} className="text-zinc-200 mb-3" />
            <p className="text-base font-black text-zinc-400 uppercase tracking-widest">
              No sources found
            </p>
            <p className="text-base text-zinc-400 mt-1">
              Add a new source to this syllabus to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sources.map((source) => (
              <div
                key={source.sourceId}
                className="group relative rounded-2xl border border-zinc-200 bg-white p-4 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-[11px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-100/50">
                        {source.type?.replace("_", " ") || "SOURCE"}
                      </span>
                      <h3 className="text-base font-black text-zinc-900 tracking-tight">
                        {source.sourceName}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500">
                          Author
                        </span>
                        <span className="text-base font-bold text-zinc-600">
                          {source.author || "No author"}
                        </span>
                      </div>

                      {source.publishedYear && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <History size={14} />
                          <span className="text-base font-semibold">
                            {source.publishedYear}
                          </span>
                        </div>
                      )}

                      {source.url && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500">
                            URL
                          </span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-bold text-sky-600 hover:underline break-all"
                          >
                            {source.url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSourceClick(source.sourceId)}
                    disabled={deletingSourceId === source.sourceId}
                    className="self-end md:self-start h-9 px-3 rounded-xl border border-red-100 bg-white text-red-600 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    {deletingSourceId === source.sourceId
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateSourceModal
          syllabusId={syllabusId}
          isOpen={isCreateSourceModalOpen}
          onClose={() => setIsCreateSourceModalOpen(false)}
          onSuccess={handleCreateSourceSuccess}
        />

        <ConfirmModal
          isOpen={isConfirmDeleteModalOpen}
          title="Delete Source"
          message="Are you sure you want to delete this source? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmUnlinkSource}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          isDanger={true}
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <History size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-900">
              Syllabus Action Log
            </h2>
            <p className="text-base text-zinc-500">
              Track all important changes of this syllabus.
            </p>
          </div>
        </div>

        {!syllabusId && (
          <p className="text-base text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
            Missing syllabusId in URL. Cannot load action logs.
          </p>
        )}

        {syllabusId && isLogsLoading ? (
          <p className="text-base text-zinc-500">
            Loading syllabus action logs...
          </p>
        ) : syllabusId && syllabusLogs.length === 0 ? (
          <p className="text-base text-zinc-500">
            No action logs found for this syllabus.
          </p>
        ) : (
          <div className="space-y-3">
            {syllabusLogs.map((log) => (
              <div
                key={log.logId}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-zinc-900">
                      {log.actionByFullName || "Unknown user"}
                    </p>
                    <span className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-600">
                      {log.actionType || "UNKNOWN"}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-zinc-500">
                    {log.createdAt || "N/A"}
                  </p>
                </div>
                <p className="mt-2 text-base text-zinc-700">
                  {log.note || "No note"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
