"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setUser } from "@/store/slices/authSlice";
import { User as UserIcon, Mail, Shield, MapPin, Loader2, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SubjectService } from "@/services/subject.service";
import { AccountService } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://blydhlkiaqmgdhnueqad.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWRobGtpYXFtZ2RobnVlcWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Mjk2ODMsImV4cCI6MjA5MzEwNTY4M30.oeBAhVfqlHLOC8wgbKE1yL3AW_y835IgBEd9nPJaiuI";
const SUPABASE_BUCKET = "academic-docs";

const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\s+/g, "-");
  str = str.replace(/[^a-zA-Z0-9.\-_]/g, "");
  return str;
};

export default function ProfileContent() {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const { showToast } = useToast();

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [fullNameInput, setFullNameInput] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: deptsRes } = useQuery({
        queryKey: ["departments"],
        queryFn: () => SubjectService.getDepartments({ size: 100 }),
    });

    const departmentName = deptsRes?.data?.content?.find(
        (dept: any) => dept.departmentId === user?.departmentId
    )?.departmentName || user?.departmentId || "Academic Quality Control";

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    if (!user) return null;

    const handleEditToggle = () => {
        setIsEditing(true);
        setFullNameInput(user.fullName || "");
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFullNameInput(user.fullName || "");
        setAvatarFile(null);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setAvatarFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setAvatarPreview(url);
        }
    };

    const handleSave = async () => {
        if (!fullNameInput.trim()) {
            showToast("Full name cannot be empty", "error");
            return;
        }
        setSaving(true);
        try {
            let uploadedUrl = user.avatarUrl || "";
            if (avatarFile) {
                const cleanTitle = removeVietnameseTones(user.accountId);
                const cleanName = `${cleanTitle}_avatar_${Date.now()}_${removeVietnameseTones(avatarFile.name)}`;
                const filePath = `avatars/${cleanName}`;
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filePath}`;

                const uploadRes = await fetch(uploadUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                        apikey: SUPABASE_ANON_KEY,
                        "Content-Type": avatarFile.type,
                        "x-upsert": "true",
                    },
                    body: avatarFile,
                });

                if (!uploadRes.ok) throw new Error("Failed to upload avatar to storage.");
                uploadedUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;
            }

            // Call API
            await AccountService.updateAccount(user.accountId, {
                fullName: fullNameInput,
                phoneNumber: "",
                avatarUrl: uploadedUrl,
            });

            // Update Redux state
            const updatedUser = {
                ...user,
                fullName: fullNameInput,
                avatarUrl: uploadedUrl,
            };
            dispatch(setUser(updatedUser));

            // Update smd-user cookie
            document.cookie = `smd-user=${encodeURIComponent(JSON.stringify(updatedUser))}; path=/; max-age=${60 * 60 * 24};`;

            showToast("Profile updated successfully", "success");
            setIsEditing(false);
        } catch (err: any) {
            showToast(err.message || "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
            {/* Minimal Header */}
            <div className="pb-12 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-medium text-zinc-900 mb-2">Internal Profile.</h1>
                    <p className="text-zinc-500 font-medium tracking-tight">System Identity Details</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={handleEditToggle}
                        className="px-5 py-2.5 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-[0.98] shadow-sm"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-900 transition-all active:scale-[0.98] shadow-md flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {saving && <Loader2 size={12} className="animate-spin" />}
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-5 py-2.5 bg-zinc-100 text-zinc-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 border border-zinc-200 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm flex flex-col items-center text-center space-y-6">
                        <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative group/avatar">
                            {avatarPreview || user.avatarUrl ? (
                                <img
                                    src={(avatarPreview || user.avatarUrl) ?? undefined}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon size={64} className="text-zinc-300" />
                            )}
                            {isEditing && (
                                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white text-[10px] font-black uppercase gap-1">
                                    <Camera size={16} />
                                    Change
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            )}
                        </div>
                        <div className="w-full">
                            {isEditing ? (
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullNameInput}
                                        onChange={(e) => setFullNameInput(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-3 text-sm font-bold text-center focus:bg-white focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-zinc-900">{user.fullName}</h2>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{user.role}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Area */}
                <div className="lg:col-span-2 space-y-12">
                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                            <span className="w-8 h-px bg-zinc-200" />
                            Security Credentials
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { icon: Mail, label: "Institutional Email", value: user.email },
                                { icon: Shield, label: "System Role", value: user.role },
                                { icon: MapPin, label: "Department", value: departmentName },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-zinc-50 shadow-sm hover:border-zinc-200 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <item.icon size={18} strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-bold text-zinc-900">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
