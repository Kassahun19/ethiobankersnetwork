import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "motion/react";
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Briefcase, 
  FileText, 
  Settings, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Camera,
  Save,
  Trash2
} from "lucide-react";
import { BANKS } from "../constants";
import BankVerification from "../components/BankVerification";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bank: user?.bank || "",
    bio: "",
    linkedin: "",
    phone: user?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user/profile");
        setFormData({
          ...formData,
          ...res.data,
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await api.put("/user/profile", formData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500">Manage your professional information and settings.</p>
        </div>
        <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <User className="w-16 h-16 text-blue-800" />
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 bg-blue-800 text-white rounded-full shadow-lg hover:bg-blue-900 transition-all">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{user?.bank || 'Banking Professional'}</p>
            
            {user?.is_verified ? (
              <div className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold inline-flex items-center border border-green-100">
                <ShieldCheck className="w-3 h-3 mr-1.5" /> Verified Banker
              </div>
            ) : (
              <div className="bg-yellow-50 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-bold inline-flex items-center border border-yellow-100">
                <AlertCircle className="w-3 h-3 mr-1.5" /> Unverified
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-400 uppercase font-bold">Applications</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">45</p>
                <p className="text-xs text-gray-400 uppercase font-bold">Views</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 flex items-center transition-all">
                <FileText className="w-4 h-4 mr-3" /> View My CV
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 flex items-center transition-all">
                <Briefcase className="w-4 h-4 mr-3" /> Saved Jobs
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 flex items-center transition-all">
                <Trash2 className="w-4 h-4 mr-3" /> Delete Account
              </button>
            </div>
          </div>

          {!user?.is_verified && <BankVerification />}
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            {message.text && (
              <div className={`mb-8 p-4 rounded-xl flex items-center text-sm border ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Affiliation</label>
                  <select
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="">Select your bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="+251 9..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Bio</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Tell us about your banking experience and career goals..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-800 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition-all shadow-md flex items-center disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
