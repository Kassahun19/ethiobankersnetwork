import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Share2,
  Bookmark
} from "lucide-react";

const JobDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error("Failed to fetch job", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setApplying(true);
    try {
      await api.post("/applications", { jobId: id });
      setApplied(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to apply for job");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
        <Link to="/jobs" className="text-blue-800 font-bold hover:underline">Back to all jobs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-blue-800 font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mr-6">
                  <Building2 className="w-10 h-10 text-blue-800" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center text-blue-800 font-bold">
                    {job.bank} <ShieldCheck className="w-4 h-4 ml-1.5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex space-x-2">
                <button className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Location</p>
                <p className="text-gray-900 font-semibold flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> {job.location || 'Addis Ababa'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Job Type</p>
                <p className="text-gray-900 font-semibold flex items-center">
                  <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" /> {job.type || 'Full-time'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Salary</p>
                <p className="text-green-600 font-bold flex items-center">
                  <DollarSign className="w-4 h-4 mr-1.5" /> {job.salary || 'Negotiable'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Posted</p>
                <p className="text-gray-900 font-semibold flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-400" /> {job.postedDate || '2 days ago'}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Job Description</h3>
              <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                {job.description}
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
              <ul className="space-y-3">
                {(job.requirements || [
                  "Bachelor's degree in Banking, Finance, or related field.",
                  "Minimum of 3 years experience in a similar role.",
                  "Strong understanding of Ethiopian banking regulations.",
                  "Excellent communication and analytical skills.",
                  "Proficiency in banking software and MS Office."
                ]).map((req: string, i: number) => (
                  <li key={i} className="flex items-start text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Apply Card */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Interested in this role?</h3>
            <div className="space-y-4">
              {applied ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-center font-bold border border-green-100">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Application Sent
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full bg-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition-all shadow-md flex items-center justify-center disabled:opacity-50"
                >
                  {applying ? <Loader2 className="w-6 h-6 animate-spin" /> : "Apply Now"}
                </button>
              )}
              <p className="text-xs text-gray-400 text-center">
                By applying, you agree to share your profile and CV with {job.bank}.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">About the Bank</h4>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                {job.bank} is one of the leading financial institutions in Ethiopia, committed to providing innovative banking solutions and fostering professional growth.
              </p>
              <Link to={`/banks/${job.bankId}`} className="text-blue-800 text-sm font-bold hover:underline flex items-center">
                View Bank Profile <ArrowLeft className="ml-1 w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>

          {/* AI Match Score (Placeholder) */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl p-8 text-white shadow-lg">
            <h3 className="text-xl font-bold mb-2">AI Match Score</h3>
            <div className="flex items-center mb-4">
              <span className="text-4xl font-black mr-3">92%</span>
              <div className="h-2 flex-grow bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <p className="text-sm text-yellow-50">
              Your skills and experience are a great match for this position. We highly recommend applying!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
