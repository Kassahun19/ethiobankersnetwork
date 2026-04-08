import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "motion/react";
import { 
  Briefcase, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Upload, 
  Loader2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import CVAnalyzer from "../components/CVAnalyzer";
import PostJob from "../components/PostJob";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    appliedJobs: 0,
    savedJobs: 0,
    profileViews: 0,
    activeApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([
          api.get("/user/stats"),
          api.get("/user/applications/recent"),
        ]);
        setStats(statsRes.data);
        setRecentApplications(appsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("cv", file);

    try {
      await api.post("/user/upload-cv", formData);
      alert("CV uploaded successfully!");
    } catch (err) {
      alert("Failed to upload CV");
    } finally {
      setUploading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your career today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center shadow-sm">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Update CV
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
          </label>
          <Link to="/jobs" className="bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-900 transition-all shadow-md flex items-center">
            Find Jobs <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Applied Jobs", value: stats.appliedJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Apps", value: stats.activeApplications, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Profile Views", value: stats.profileViews, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Success Rate", value: "85%", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 space-y-6">
          {user?.role === 'employer' && <PostJob />}
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
              <Link to="/jobs" className="text-blue-800 text-sm font-bold hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentApplications.length > 0 ? (
                recentApplications.map((app) => (
                  <div key={app.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
                        <Briefcase className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{app.jobTitle}</h4>
                        <p className="text-gray-500 text-sm">{app.bankName} • Applied {app.appliedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold mr-4 ${
                        app.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {app.status}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-500">
                  <p>No recent applications found.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations (Placeholder) */}
          <CVAnalyzer />

          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <h3 className="text-2xl font-bold mb-4">AI Career Insights</h3>
            <p className="text-blue-100 mb-6 max-w-lg">
              Based on your profile and recent job trends in Ethiopia, you have a high potential for "Senior Risk Analyst" roles.
            </p>
            <button className="bg-white text-blue-800 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-all">
              View Recommendations
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Profile Completion</h3>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-sm text-gray-500 mb-6">75% complete - Add your bank email to get verified!</p>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Uploaded CV
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Basic Info
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-200 rounded-full mr-2"></div>
                Verify Bank Email
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Subscription</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">
                {user?.subscription_plan || 'Free'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Upgrade to Premium to apply for unlimited jobs and get verified.</p>
            <Link to="/subscription" className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">
              Upgrade Plan
            </Link>
          </div>

          {/* Referral System */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Refer a Colleague</h3>
            <p className="text-sm text-gray-500 mb-4">Invite fellow bankers and earn 1 month of Premium!</p>
            <div className="flex space-x-2">
              <input 
                type="text" 
                readOnly 
                value={`ethiobankers.et/ref/${user?.id?.substring(0, 6)}`}
                className="flex-grow text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none"
              />
              <button className="bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition-all">
                Copy
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          {user?.is_verified ? (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center">
              <div className="bg-green-100 p-3 rounded-xl mr-4">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-green-900">Verified Banker</h4>
                <p className="text-xs text-green-700">Official {user.bank} Employee</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl">
              <h4 className="font-bold text-yellow-900 mb-2">Get Verified</h4>
              <p className="text-sm text-yellow-700 mb-4">Verify your employment to gain trust from employers.</p>
              <button className="text-yellow-800 text-sm font-bold flex items-center hover:underline">
                Start Verification <ExternalLink className="ml-1 w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
