import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "motion/react";
import { CheckCircle2, ShieldCheck, Zap, Crown, Loader2, CreditCard } from "lucide-react";

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0",
      description: "Basic features for job seekers.",
      features: [
        "Browse all banking jobs",
        "Basic profile visibility",
        "Apply to 3 jobs per month",
        "Community access",
      ],
      icon: Zap,
      color: "text-gray-600",
      bg: "bg-gray-50",
      buttonText: "Current Plan",
      disabled: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: "100",
      description: "Accelerate your job search.",
      features: [
        "Unlimited job applications",
        "Verified Banker Badge",
        "AI CV Analysis (Basic)",
        "Priority support",
        "Profile boost in search",
      ],
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
      buttonText: "Upgrade to Premium",
      popular: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: "300",
      description: "For serious career growth.",
      features: [
        "Everything in Premium",
        "Direct Messaging to Employers",
        "Advanced AI Recommendations",
        "Salary insights for roles",
        "Exclusive networking events",
      ],
      icon: Crown,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      buttonText: "Upgrade to Pro",
    },
  ];

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      // In a real app, this would redirect to a payment gateway
      await api.post("/payments/subscribe", { planId });
      alert("Subscription successful! (Demo Mode)");
      window.location.reload();
    } catch (err) {
      alert("Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Upgrade Your Career</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your professional goals and unlock the full potential of EthioBankers Network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-3xl p-8 shadow-xl border-2 flex flex-col ${
              plan.popular ? 'border-blue-500 relative scale-105' : 'border-gray-100'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
            )}
            
            <div className={`w-14 h-14 rounded-2xl ${plan.bg} ${plan.color} flex items-center justify-center mb-6`}>
              <plan.icon className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
            <p className="text-gray-500 text-sm mb-6">{plan.description}</p>

            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-black text-gray-900">{plan.price}</span>
              <span className="text-gray-500 ml-2 font-bold">ETB / month</span>
            </div>

            <ul className="space-y-4 mb-10 flex-grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading || plan.disabled || user?.subscription_plan === plan.id}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                plan.id === 'free' || user?.subscription_plan === plan.id
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-lg'
                  : 'bg-gray-900 text-white hover:bg-black shadow-md'
              }`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 
               user?.subscription_plan === plan.id ? "Current Plan" : plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center">
          <CreditCard className="w-6 h-6 mr-2 text-blue-800" /> Supported Payment Methods
        </h3>
        <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
              <span className="font-black text-blue-800">Telebirr</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
              <span className="font-black text-green-600">CBE Birr</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
              <span className="font-black text-yellow-600">M-Pesa</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
              <span className="font-black text-gray-800">Chapa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
