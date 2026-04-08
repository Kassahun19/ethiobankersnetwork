import React, { useState } from "react";
import api from "../services/api";
import { motion } from "motion/react";
import { Briefcase, Building2, MapPin, DollarSign, Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";

const PostJob: React.FC = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bank: "",
    salary: "",
    location: "",
    type: "Full-time",
    requirements: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const requirementsArray = formData.requirements.split("\n").filter(r => r.trim() !== "");
      await api.post("/jobs", { ...formData, requirements: requirementsArray });
      setSuccess(true);
    } catch (err) {
      setError("Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h3>
        <p className="text-gray-500 mb-8">Your job posting is now live and visible to all banking professionals.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-blue-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all"
        >
          Post Another Job
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center mb-8">
        <div className="bg-blue-50 p-3 rounded-xl mr-4">
          <Plus className="w-6 h-6 text-blue-800" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Post a New Banking Job</h3>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-100">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g. Senior Relationship Manager"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g. Awash Bank"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g. Addis Ababa"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Range</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g. 30,000 - 40,000 ETB"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
            >
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            placeholder="Describe the role, responsibilities, and expectations..."
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements (One per line)</label>
          <textarea
            rows={4}
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            placeholder="Requirement 1&#10;Requirement 2&#10;Requirement 3..."
          ></textarea>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-800 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition-all shadow-md flex items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Plus className="w-6 h-6 mr-2" />}
            Post Job
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
