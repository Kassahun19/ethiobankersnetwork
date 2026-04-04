import React, { useState } from "react";
import api from "../services/api";
import { motion } from "motion/react";
import { ShieldCheck, Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const BankVerification: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // In a real app, this would send a verification code to the bank email
      await api.post("/user/verify-bank-email", { email });
      setSuccess(true);
    } catch (err) {
      setError("Failed to send verification email. Please check the address.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-100 p-8 rounded-3xl text-center">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="text-xl font-bold text-green-900 mb-2">Verification Sent!</h4>
        <p className="text-green-700 text-sm">
          We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to get your verified badge.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="bg-blue-50 p-3 rounded-xl mr-4">
          <ShieldCheck className="w-6 h-6 text-blue-800" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Get Verified</h3>
      </div>
      
      <p className="text-gray-500 text-sm mb-8">
        Enter your official bank email address (e.g., name@awashbank.com) to receive a verified badge on your profile.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-100">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="yourname@bank.et"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-800 text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-md flex items-center justify-center disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send Verification <ArrowRight className="ml-2 w-5 h-5" /></>}
        </button>
      </form>
    </div>
  );
};

export default BankVerification;
