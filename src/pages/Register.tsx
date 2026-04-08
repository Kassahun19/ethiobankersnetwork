import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "motion/react";
import { Mail, Lock, User, Building2, AlertCircle, Loader2, ArrowRight, Eye, EyeOff, Phone } from "lucide-react";
import { BANKS } from "../constants";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    bank: "",
    role: "user" as const,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", formData);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Registration error details:", err.response?.data || err.message);
      const serverMsg = err.response?.data?.message;
      const serverErr = err.response?.data?.error;
      
      let displayError = "";
      if (serverMsg && serverErr) {
        const detail = typeof serverErr === 'object' ? JSON.stringify(serverErr) : serverErr;
        displayError = `${serverMsg}: ${detail}`;
      } else if (serverMsg) {
        displayError = serverMsg;
      } else if (serverErr) {
        displayError = typeof serverErr === 'string' ? serverErr : JSON.stringify(serverErr);
      } else {
        displayError = err.message || "Failed to register. Please try again.";
      }
      
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  const banks = BANKS;

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Network</h1>
          <p className="text-gray-500">Create your professional banking profile</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Kassahun Mulatu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="name@bank.et"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="+251 911 223344"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Affiliation</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                value={formData.bank}
                onChange={(e) => {
                  const bank = e.target.value;
                  setFormData({ 
                    ...formData, 
                    bank, 
                    role: bank === "Other / Job Seeker" ? "user" : formData.role 
                  });
                }}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
              >
                <option value="">Select your bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              {formData.bank === "Other / Job Seeker" ? (
                <button
                  type="button"
                  className="col-span-2 py-3.5 rounded-xl font-semibold border bg-blue-50 border-blue-500 text-blue-800"
                >
                  Job Seeker
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "user" })}
                    className={`py-3.5 rounded-xl font-semibold border transition-all ${
                      formData.role === "user" 
                        ? "bg-blue-50 border-blue-500 text-blue-800" 
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "employer" })}
                    className={`py-3.5 rounded-xl font-semibold border transition-all ${
                      formData.role === "employer" 
                        ? "bg-blue-50 border-blue-500 text-blue-800" 
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Employer
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-800 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
