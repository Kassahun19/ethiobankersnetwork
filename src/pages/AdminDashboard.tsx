import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Users, Briefcase, FileText, Shield, Search, Filter, Trash2, CheckCircle, XCircle, Gift } from "lucide-react";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  bank: string;
  is_verified: boolean;
  created_at: string;
  source?: string;
}

interface Job {
  id: string;
  title: string;
  bank: string;
  location: string;
  created_at: string;
}

interface Referral {
  id: string;
  user_name: string;
  referee_name: string;
  referee_email: string;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "jobs" | "referrals">("users");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, jobsRes, referralsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/jobs"),
          api.get("/admin/referrals")
        ]);
        setUsers(usersRes.data);
        setJobs(jobsRes.data);
        setReferrals(referralsRes.data);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReferrals = referrals.filter(r => 
    r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.referee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.referee_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-800" />
            Admin Control Center
          </h1>
          <p className="text-gray-500 mt-1">Manage users, jobs, and platform data</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-800" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-8 py-4 font-semibold transition-all ${
              activeTab === "users" ? "text-blue-800 border-b-2 border-blue-800 bg-blue-50/30" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-8 py-4 font-semibold transition-all ${
              activeTab === "jobs" ? "text-blue-800 border-b-2 border-blue-800 bg-blue-50/30" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Job Postings
          </button>
          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-8 py-4 font-semibold transition-all ${
              activeTab === "referrals" ? "text-blue-800 border-b-2 border-blue-800 bg-blue-50/30" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Referrals
          </button>
        </div>

        <div className="p-6">
          {activeTab === "users" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-medium">User</th>
                    <th className="pb-4 font-medium">Bank</th>
                    <th className="pb-4 font-medium">Role</th>
                    <th className="pb-4 font-medium">Source</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 font-medium">Joined</th>
                    <th className="pb-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">{user.bank}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'employer' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          user.source === 'telegram_bot' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.source || 'website'}
                        </span>
                      </td>
                      <td className="py-4">
                        {user.is_verified ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                            <XCircle className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === "jobs" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-medium">Job Title</th>
                    <th className="pb-4 font-medium">Bank</th>
                    <th className="pb-4 font-medium">Location</th>
                    <th className="pb-4 font-medium">Posted Date</th>
                    <th className="pb-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">{job.title}</td>
                      <td className="py-4 text-gray-600">{job.bank}</td>
                      <td className="py-4 text-gray-600">{job.location}</td>
                      <td className="py-4 text-gray-500 text-sm">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-medium">Referrer</th>
                    <th className="pb-4 font-medium">Referee</th>
                    <th className="pb-4 font-medium">Referee Email</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">{ref.user_name}</td>
                      <td className="py-4 text-gray-600">{ref.referee_name}</td>
                      <td className="py-4 text-gray-600">{ref.referee_email}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          ref.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500 text-sm">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
