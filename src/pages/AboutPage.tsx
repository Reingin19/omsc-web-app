import React from "react";
import { Card } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { Target, Users, Award, Heart, Mail, ArrowRight, ShieldCheck } from "lucide-react";

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To provide comprehensive guidance services that support student development, academic success, and personal growth in alignment with CHED standards.",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Users,
      title: "Student-Centered",
      description: "We prioritize student needs and well-being, offering personalized support and resources tailored to individual circumstances.",
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We maintain high standards in all guidance programs and services, continuously improving based on feedback and best practices.",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      icon: Heart,
      title: "Compassionate Care",
      description: "We provide a safe, supportive environment where students feel heard, respected, and empowered to overcome challenges.",
      color: "bg-rose-50 text-rose-600"
    },
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20">
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <Badge className="bg-indigo-100 text-indigo-600 border-none font-black px-4 py-1 rounded-full uppercase italic text-[10px] tracking-widest">
                Our Identity
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
                Empowering <br /> <span className="text-indigo-600">OMSCians</span>
              </h1>
              <p className="text-lg font-medium text-slate-500 leading-relaxed italic max-w-xl mx-auto lg:mx-0">
                The Occidental Mindoro State College Guidance Office is dedicated to the holistic development of every student through modern programs and compassionate counseling.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase italic text-slate-600">CHED Accredited</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-2xl">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase italic text-slate-600">Student First</span>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] rotate-3 scale-105 opacity-10 group-hover:rotate-0 transition-transform duration-500" />
              <img
                src="https://i.ibb.co/SDCTBBY7/download-4.jpg"
                alt="guidance staff"
                className="relative w-full h-[450px] object-cover rounded-[3.5rem] shadow-2xl z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase text-slate-900 tracking-tighter">Our Core Values</h2>
            <div className="w-24 h-2 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="p-8 bg-white border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-2 rounded-[2.5rem] group text-center flex flex-col items-center"
              >
                <div className={`w-20 h-20 ${value.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <value.icon className="h-10 w-10" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 mb-3">{value.title}</h3>
                <p className="text-sm font-medium text-slate-500 italic leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- SERVICES HIGHLIGHT --- */}
      <section className="py-24 bg-white rounded-[4rem] md:rounded-[6rem] mx-4 shadow-inner">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="group p-2 bg-slate-50 border-none rounded-[3.5rem] overflow-hidden shadow-xl hover:shadow-indigo-100 transition-all duration-500">
              <div className="relative h-64 overflow-hidden rounded-[3rem]">
                <img
                  src="https://lead-academy.org/blog/wp-content/uploads/2022/12/Advantages-and-Disadvantages-of-Individual-Counselling-3.jpg"
                  alt="counseling"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <h3 className="absolute bottom-8 left-8 text-3xl font-black italic uppercase text-white tracking-tighter">Individual Counseling</h3>
              </div>
              <div className="p-8">
                <p className="text-slate-500 font-medium italic leading-relaxed">
                  Confidential one-on-one sessions tailored to help you navigate through personal challenges, academic pressure, and career decisions.
                </p>
              </div>
            </Card>

            <Card className="group p-2 bg-slate-50 border-none rounded-[3.5rem] overflow-hidden shadow-xl hover:shadow-indigo-100 transition-all duration-500">
              <div className="relative h-64 overflow-hidden rounded-[3rem]">
                <img
                  src="https://i.ibb.co/84B2N80D/download-3.png"
                  alt="group programs"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <h3 className="absolute bottom-8 left-8 text-3xl font-black italic uppercase text-white tracking-tighter">Group Programs</h3>
              </div>
              <div className="p-8">
                <p className="text-slate-500 font-medium italic leading-relaxed">
                  Interactive workshops and seminars designed to build peer support networks and develop essential life skills for the modern world.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* --- CONTACT CTA --- */}
      <section className="mt-24 max-w-[1000px] mx-auto px-6">
        <div className="bg-indigo-600 rounded-[3.5rem] p-10 md:p-16 text-center shadow-2xl shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tighter leading-none">
              Need Support? <br /> We're Listening.
            </h2>
            <p className="text-indigo-100 font-medium italic text-lg max-w-xl mx-auto">
              Don't navigate college life alone. Reach out to our professional counselors today.
            </p>
            <div className="pt-6">
              <a
                href="mailto:guidance@omsc.edu.ph"
                className="inline-flex items-center px-10 py-5 bg-white text-indigo-600 hover:bg-slate-50 font-black italic uppercase tracking-widest rounded-2xl transition-all shadow-xl hover:-translate-y-1 group"
              >
                <Mail className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                Contact Us Now
                <ArrowRight className="w-5 h-5 ml-3" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;