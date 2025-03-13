'use client'

import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Facebook, Mail, ChevronRight, Book, Code, Settings, ChevronDown } from "lucide-react";
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { ModeToggle } from "@/components/mode-toggle";
import { useRouter } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { cn  } from '@/lib/utils';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const { status, login } = useFacebookAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const [currency, setCurrency] = useState<'USD' | 'PHP'>('USD');
  
  // Exchange rate (1 USD to PHP)
  const phpRate = 56.50;

  const formatPrice = (usdPrice: string) => {
    const price = parseFloat(usdPrice);
    return currency === 'USD' 
      ? `$${price}`
      : `₱${Math.round(price * phpRate)}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  const handleFacebookLogin = () => {
    if (status === 'connected') {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Mass Messaging",
      description: "Send personalized messages to all your page followers at once"
    },
    {
      icon: <ChevronRight className="h-5 w-5" />,
      title: "Automated Workflows",
      description: "Create custom sequences for engagement campaigns"
    },
    {
      icon: <Facebook className="h-5 w-5" />,
      title: "Facebook Integration",
      description: "Seamlessly connect with Facebook's marketing tools"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "49",
      features: ["1,000 messages/month", "Basic analytics", "Email support"],
      recommended: false
    },
    {
      name: "Professional",
      price: "99",
      features: ["10,000 messages/month", "Advanced analytics", "Priority support", "API access"],
      recommended: true
    },
    {
      name: "Enterprise",
      price: "249",
      features: ["Unlimited messages", "Custom analytics", "24/7 support", "Custom integration"],
      recommended: false
    }
  ];

  const codeExample = `
  // Example usage of KickerPro API
  const kickerPro = new KickerPro({
    apiKey: 'your-api-key'
  });
  
  await kickerPro.sendMessage({
    audience: 'followers',
    template: 'welcome',
    personalization: {
      name: '{{user.firstName}}'
    }
  });
  `;

  const CurrencySelector = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="relative inline-block">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as 'USD' | 'PHP')}
          className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USD">USD ($)</option>
          <option value="PHP">PHP (₱)</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );

  const faqItems = [
    {
      question: "What is KickerPro?",
      answer: "KickerPro is an enterprise-grade Facebook marketing solution that helps businesses manage and automate their Facebook messaging campaigns effectively."
    },
    {
      question: "How does bulk messaging work?",
      answer: "Our bulk messaging feature allows you to send personalized messages to multiple recipients while complying with Facebook's messaging policies and guidelines."
    },
    {
      question: "Is it compliant with Facebook's policies?",
      answer: "Yes, KickerPro is fully compliant with Facebook's messaging policies and terms of service. We ensure all communications follow the platform's guidelines."
    },
    {
      question: "What support do you offer?",
      answer: "We provide 24/7 technical support, comprehensive documentation, and dedicated account managers for enterprise customers."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background transition-all duration-500">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                {isDark && (
                  <div className="absolute inset-0 bg-blue-400/10 blur-xl rounded-full transition-opacity duration-300" />
                )}
              </div>
              <span className="font-bold text-xl text-foreground transition-colors duration-300">
                Kicker<span className="text-blue-600 dark:text-blue-400">Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#features" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                Features
              </a>
              <a href="#pricing" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                Pricing
              </a>
              <a href="#about" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                About
              </a>
              <ModeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1" ref={ref}>
        {/* Hero Section with Parallax */}
        <motion.section
          className="relative overflow-hidden py-20 md:py-32"
          style={{ y: parallaxY, opacity: parallaxOpacity }}
        >
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="initial"
              animate="animate"
              variants={stagger}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-block mb-6 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors duration-300"
              >
                Enterprise-Grade Facebook Marketing Solution
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight transition-colors duration-300 leading-tight"
              >
                Accelerate growth with intelligent&nbsp;
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 transition-colors duration-300">
                  Facebook messaging
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
              >
                The most powerful platform for businesses to engage, convert, and retain customers through Facebook&apos;s messaging platform.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFacebookLogin}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Facebook className="h-5 w-5 text-white" />
                  <span>{status === 'connected' ? 'Go to Dashboard' : 'Continue with Facebook'}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="#demo"
                  className="w-full sm:w-auto bg-background hover:bg-secondary border border-border text-foreground font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <span>Watch Demo</span>
                </motion.a>
              </motion.div>
            </motion.div>
          </div>

          {/* Background Elements */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
          </motion.div>
        </motion.section>

        {/* Documentation Section */}
        <section id="documentation" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-foreground mb-8">Documentation</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Quick Start Guide</h3>
                  <p className="text-muted-foreground">Get started with KickerPro in minutes</p>
                  <div className="bg-secondary/20 rounded-lg p-6">
                    <SyntaxHighlighter language="javascript" style={tomorrow}>
                      {codeExample}
                    </SyntaxHighlighter>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {[
                      { icon: <Book />, title: "Guides", desc: "Step-by-step tutorials" },
                      { icon: <Code />, title: "API Reference", desc: "Complete API documentation" },
                      { icon: <Settings />, title: "Configuration", desc: "Setup and customization" }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border"
                      >
                        <div className="text-blue-600 dark:text-blue-400">{item.icon}</div>
                        <div>
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-background border-y border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className={cn(
                "text-3xl font-bold text-center mb-12",
                isDark ? "text-gray-100" : "text-gray-900"
              )}>
                Frequently Asked Questions
              </h2>

              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className={cn(
                      "border-b last:border-0 px-6",
                      isDark
                        ? "border-gray-800 hover:bg-gray-950/50"
                        : "border-gray-200 hover:bg-gray-50/50"
                    )}
                  >
                    <AccordionTrigger className={cn(
                      "text-left no-underline hover:no-underline transition-all duration-300 ease-in-out",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <motion.div
                      initial={{ height: 0, opacity: 0, y: -20 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className={cn(
                        "overflow-hidden",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}
                      >
                      {item.answer}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-secondary/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Pricing Plans
              </h2>
              <p className="text-muted-foreground">
                Choose the plan that best fits your needs
              </p>
              <CurrencySelector />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-background rounded-xl p-6 border ${plan.recommended ? 'border-blue-500 shadow-lg' : 'border-border'}`}
                >
                  {plan.recommended && (
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
                      Recommended
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-muted-foreground">
                        <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFacebookLogin()}
                    className={`w-full py-2 px-4 rounded-lg font-medium ${plan.recommended
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                  >
                    Get Started
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to manage your Facebook marketing campaigns effectively</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-foreground">KickerPro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade Facebook marketing solutions for growing businesses.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KickerPro. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}