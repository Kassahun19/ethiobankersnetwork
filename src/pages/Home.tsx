import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Briefcase, Users, ShieldCheck, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

const Home: React.FC = () => {
  const features = [
    {
      title: "Exclusive Job Postings",
      description: "Access the latest job opportunities from all major Ethiopian banks and financial institutions.",
      icon: Briefcase,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Professional Networking",
      description: "Connect with fellow bankers, share insights, and grow your professional network within the industry.",
      icon: Users,
      color: "bg-green-100 text-green-800",
    },
    {
      title: "Verified Profiles",
      description: "Gain trust with a verified badge by confirming your bank affiliation through official email.",
      icon: ShieldCheck,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Career Growth",
      description: "Get AI-powered CV analysis and job recommendations tailored to your banking career path.",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-800",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "0 ETB",
      features: ["Browse Jobs", "Basic Profile", "Apply to 3 Jobs/Month"],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Premium",
      price: "100 ETB",
      features: ["Unlimited Job Applications", "Verified Badge", "Priority Support", "Basic AI CV Analysis"],
      buttonText: "Go Premium",
      popular: true,
    },
    {
      name: "Pro",
      price: "300 ETB",
      features: ["All Premium Features", "Direct Employer Messaging", "Advanced AI Recommendations", "Profile Boost"],
      buttonText: "Go Pro",
      popular: false,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-blue-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
            >
              The Hub for <span className="text-yellow-500">Ethiopian Banking</span> Professionals
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto"
            >
              Connect, grow, and find your next career move in Ethiopia's dynamic financial sector. 
              Join thousands of verified bankers today.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link
                to="/register"
                className="bg-yellow-500 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition-all flex items-center justify-center"
              >
                Join the Network <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/jobs"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                Browse Jobs
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why EthioBankers Network?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the tools and connections you need to excel in the Ethiopian financial industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-gray-600">Unlock premium features to accelerate your career growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-3xl bg-white border ${plan.popular ? 'border-blue-500 shadow-2xl scale-105 relative' : 'border-gray-200 shadow-lg'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${
                    plan.popular 
                      ? 'bg-blue-800 text-white hover:bg-blue-900' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-800 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Ready to take your banking career to the next level?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto relative z-10">
              Join the largest professional community for bankers in Ethiopia.
            </p>
            <Link
              to="/register"
              className="bg-white text-blue-800 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all relative z-10 inline-block"
            >
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
