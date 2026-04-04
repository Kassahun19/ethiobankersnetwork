import React, { useState, useEffect } from "react";
import api from "../services/api";
import { motion } from "motion/react";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Filter, 
  ChevronRight,
  Loader2,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { Link } from "react-router-dom";

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get("/jobs");
        setJobs(res.data);
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const filteredJobs = jobs.filter(job => 
    (job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     job.bank.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedBank === "" || job.bank === selectedBank)
  );

  const banks = Array.from(new Set(jobs.map(job => job.bank)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Banking Jobs in Ethiopia</h1>
        <p className="text-gray-500">Find your next career move in the financial sector.</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col lg:flex-row gap-4">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="lg:w-64 relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
          >
            <option value="">All Banks</option>
            {banks.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>
        <button className="bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center">
          <Filter className="w-4 h-4 mr-2" /> More Filters
        </button>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-blue-800 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Building2 className="w-8 h-8 text-blue-800" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-800 transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center font-semibold text-gray-700">
                          <Building2 className="w-4 h-4 mr-1.5" /> {job.bank}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5" /> {job.location || 'Addis Ababa'}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1.5" /> {job.type || 'Full-time'}
                        </span>
                        <span className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4 mr-1.5" /> {job.salary || 'Negotiable'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => toggleSaveJob(job.id)}
                      className={`p-3 rounded-xl border transition-all ${
                        savedJobs.includes(job.id) 
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                          : 'bg-white border-gray-200 text-gray-400 hover:text-yellow-600 hover:border-yellow-200'
                      }`}
                    >
                      {savedJobs.includes(job.id) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                    </button>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="bg-blue-800 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-900 transition-all flex items-center shadow-sm"
                    >
                      View Details <ChevronRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white p-20 rounded-3xl text-center border border-dashed border-gray-300">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Jobs;
