import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "motion/react";
import { Users, Mail, Send, CheckCircle2, Clock, Loader2, AlertCircle, Gift } from "lucide-react";

const Referrals: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await api.get("/referrals");
      setReferrals(res.data);
    } catch (err) {
      console.error("FetchReferrals error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess(false);
    
    try {
      await api.post("/referrals", { invited_email: email });
      setSuccess(true);
      setEmail("");
      fetchReferrals();
    } catch (err) {
      setError("Failed to send invitation. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Refer & Earn</h1>
        <p className="text-xl text-gray-600">Invite your colleagues to EthioBankers Network and grow the community together.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <div className="bg-blue-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="bg-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Gift className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Invite a Colleague</h3>
              <p className="text-blue-100 mb-8 leading-relaxed">
                Help your fellow bankers find better opportunities and grow their professional network.
              </p>

              {success && (
                <div className="mb-6 p-4 bg-blue-700/50 rounded-xl flex items-center text-sm border border-blue-600">
                  <CheckCircle2 className="w-5 h-5 mr-3 text-blue-200" />
                  Invitation sent successfully!
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 rounded-xl flex items-center text-sm border border-red-500/30">
                  <AlertCircle className="w-5 h-5 mr-3 text-red-200" />
                  {error}
                </div>
              )}

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-blue-700/50 border border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all outline-none placeholder-blue-300"
                      placeholder="colleague@bank.et"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-white text-blue-800 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send Invitation <Send className="ml-2 w-5 h-5" /></>}
                </button>
              </form>
            </div>
            {/* Decorative circles */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-700 rounded-full opacity-50"></div>
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-700 rounded-full opacity-30"></div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">My Referrals</h3>
              <span className="bg-blue-50 text-blue-800 px-4 py-1 rounded-full text-sm font-bold">
                {referrals.length} Total
              </span>
            </div>

            {loading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 text-blue-800 animate-spin" />
              </div>
            ) : referrals.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {referrals.map((ref) => (
                  <div key={ref.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-3 rounded-xl mr-4">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{ref.invited_email}</h4>
                        <p className="text-sm text-gray-500">
                          Invited on {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {ref.status === "Joined" ? (
                        <span className="flex items-center text-green-600 font-bold text-sm bg-green-50 px-4 py-1.5 rounded-full">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Joined
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-600 font-bold text-sm bg-amber-50 px-4 py-1.5 rounded-full">
                          <Clock className="w-4 h-4 mr-2" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No referrals yet</h4>
                <p className="text-gray-500">Start inviting your colleagues to earn rewards and grow the network.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
