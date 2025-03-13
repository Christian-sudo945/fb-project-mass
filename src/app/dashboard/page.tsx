'use client'

import { JSX, useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sun, Moon, LogOut, Facebook, ChevronRight, Mail, Users, ChevronUp, ChevronDown, AlertCircle, Settings, HelpCircle, MoreVertical } from 'lucide-react';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { getPages, type FacebookPage, type Conversation, getCurrentUser, type FacebookUser } from '@/lib/facebook';
import { useAuthStore } from '@/store/auth';

import Cookies from 'js-cookie';
import { useTheme } from 'next-themes';
import { sendBulkMessage } from '@/lib/facebook';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar } from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SearchParamsHandler = ({ onTokenFound }: { onTokenFound: (token: string) => void }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check for both token formats
    const hash = window.location.hash;
    let token = null;

    // Check URL hash for token
    if (hash) {
      const matches = hash.match(/access_token=([^&]+)/);
      if (matches) {
        token = matches[1];
      }
    }

    // Check URL params if no token in hash
    if (!token) {
      const params = new URLSearchParams(window.location.search);
      token = params.get('Token') || params.get('token') || params.get('access_token');
    }

    if (token) {
      // Store token and clean URL
      localStorage.setItem('fb_access_token', token);
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      onTokenFound(token);
    } else {
      // Check stored token
      const storedToken = localStorage.getItem('fb_access_token');
      if (storedToken) {
        onTokenFound(storedToken);
      } else {
        router.replace('/');
      }
    }
  }, [onTokenFound, router, searchParams]);

  return null;
};

export default function Dashboard(): JSX.Element {

  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { setToken } = useAuthStore();
  const { logout } = useFacebookAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessages, setSendingMessages] = useState(false);
  const [selectedTag, setSelectedTag] = useState<'CONFIRMED_EVENT_UPDATE' | 'POST_PURCHASE_UPDATE' | 'ACCOUNT_UPDATE'>('CONFIRMED_EVENT_UPDATE');
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showMessages, setShowMessages] = useState(true);
  const [currentUser, setCurrentUser] = useState<FacebookUser | null>(null);

  // 2. Fix fetchPages callback
  const fetchPages = useCallback(async (token: string) => {
    try {
      const pageList = await getPages(token);
      setPages(pageList);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  }, []);

  const handleTokenFound = useCallback((token: string) => {
    fetchPages(token);
  }, [fetchPages]);

  const handleLogout = useCallback(async () => {
    try {
      setPages([]);
      setToken('');
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/');
    }
  }, [setToken, logout, router]);

  // 5. Fix initialization effect
  useEffect(() => {
    setMounted(true);
    const init = async () => {
      try {
        if (window.location.hash === '#_=_') {
          history.replaceState({}, document.title, window.location.href.split('#')[0]);
        }

        const storedToken = Cookies.get('fb_access_token');
        if (storedToken) {
         
        }
      } catch (error) {
        console.error('Initialization error:', error);
        handleLogout();
      }
    };

    init();
  }, [fetchPages, handleLogout]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('fb_access_token') || Cookies.get('fb_access_token');
      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('Fetching user data...'); // Debug log
      const userData = await getCurrentUser(token);
      console.log('User data fetched:', userData); // Debug log
      
      if (userData) {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user profile');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchUserData();
    }
  }, [mounted, fetchUserData]);

  // 6. Fix resize effect
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 7. Fix getChartData callback
  const getChartData = useCallback(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const initial = days.map(day => ({ name: day, value: 0 }));
    const result = [...initial];
    
    conversations.forEach((conv) => {
      const convDate = new Date(conv.updated_time);
      const dayIndex = convDate.getDay();
      result[dayIndex] = {
        name: days[dayIndex],
        value: (result[dayIndex]?.value || 0) + 1
      };
    });
    
    return result;
  }, [conversations]);

  // Early return for hydration
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  const isDark = theme === 'dark';

  const fetchConversations = async (pageId: string, pageToken: string) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/me/conversations?` +
        `access_token=${pageToken}&` +
        `fields=id,unread_count,updated_time,participants,snippet,can_reply&` +
        `limit=50`
      );
      const data = await response.json();
      setConversations(data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error("Failed to fetch conversations");
    }
  };

  const sendMessage = async (conversationId: string, message: string, pageToken: string) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            access_token: pageToken,
          }),
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  const handlePageSelect = async (page: FacebookPage) => {
    setSelectedPage(page);
    await fetchConversations(page.id, page.access_token);
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    try {
      if (!selectedConversation.can_reply) {
        toast.error("This person is unavailable right now");
        return;
      }

      setSendingMessages(true);
      await sendMessage(
        selectedConversation.id,
        replyMessage,
        selectedPage?.access_token || ''
      );

      toast.success("Message sent successfully");
      setReplyMessage('');
      setIsMessageModalOpen(false);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessages(false);
    }
  };

  const handleBulkSend = async () => {
    if (!selectedPage) return;

    try {
      setSendingMessages(true);
      await sendBulkMessage(
        selectedPage.id,
        selectedPage.access_token,
        selectedRecipients,
        messageText,
        selectedTag
      );
      toast.success(`Messages sent successfully to ${selectedRecipients.length} recipients`);
      setMessageText('');
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast.error("Failed to send messages");
    } finally {
      setSendingMessages(false);
    }
  };

  // Early return if no page is selected
  const NoPageSelected = (): JSX.Element => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="absolute top-6 right-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn(
            "p-2.5 rounded-lg transition-colors",
            isDark 
              ? "bg-gray-800 hover:bg-gray-700" 
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-gray-100" />
          ) : (
            <Moon className="h-5 w-5 text-gray-900" />
          )}
        </motion.button>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "bg-card border border-border rounded-xl p-8 shadow-lg text-center max-w-md w-full relative overflow-hidden",
          isDark ? "bg-gray-900" : "bg-white"
        )}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <Facebook className={cn(
          "h-12 w-12 mx-auto mb-4",
          isDark ? "text-blue-400" : "text-blue-600"
        )} />
        <h2 className={cn(
          "text-2xl font-bold mb-3",
          isDark ? "text-gray-100" : "text-gray-900"
        )}>
          Select a Page to Message
        </h2>
          <p className={cn(
            "mb-6",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            Choose a Facebook page from the sidebar to view conversations and send messages.
          </p>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={isDark ? "text-gray-400" : "text-gray-500"}
          >
            <ChevronRight className="h-6 w-6 transform -rotate-90" />
          </motion.div>
        </motion.div>
    </div>
  );
  

  const tagOptions = [
    { value: 'CONFIRMED_EVENT_UPDATE', label: 'Event Update' },
    { value: 'POST_PURCHASE_UPDATE', label: 'Purchase Update' },
    { value: 'ACCOUNT_UPDATE', label: 'Account Update' }
  ];
  const MobileToggle = () => (
    <button
      onClick={() => setSidebarOpen(!isSidebarOpen)}
      className="lg:hidden p-2 rounded-lg bg-background border border-border hover:bg-secondary transition-colors"
      aria-label="Toggle sidebar"
    >
      <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
    </button>
  );

  // Add this component for message visibility toggle
  const MessageVisibilityToggle = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowMessages(!showMessages)}
      className={cn(
        "flex items-center gap-2 w-fit mb-6",
        isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
      )}
    >
      {showMessages ? (
        <>
          Hide Messages <ChevronUp className="h-4 w-4" />
        </>
      ) : (
        <>
          Show Messages <ChevronDown className="h-4 w-4" />
        </>
      )}
    </Button>
  );

 

  const LoadingCard = () => (
    <Card className={cn(
      "border-border relative overflow-hidden",
      isDark ? "bg-gray-900" : "bg-white"
    )}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );

  type ChartData = {
    name: string;
    value: number;
  };

  const renderChart = (data: ChartData[]) => (
    <div className="h-16 mt-4 w-full">
      <BarChart width={200} height={60} data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Bar
          dataKey="value"
          fill={isDark ? "#3B82F6" : "#2563EB"}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </div>
  );

  const UserProfile = () => {
    if (!currentUser) {
      return (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      );
    }
  
    return (
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border">
          {currentUser.picture?.data?.url ? (
            <Image
              src={currentUser.picture.data.url}
              alt={currentUser.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center text-lg font-semibold",
              isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
            )}>
              {currentUser.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium truncate",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            {currentUser.name}
          </h3>
          {currentUser.email && (
            <p className={cn(
              "text-sm truncate",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {currentUser.email}
            </p>
          )}
          <a
            href={`https://facebook.com/profile.php?id=${currentUser.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-xs hover:underline mt-1 inline-block",
              isDark ? "text-blue-400" : "text-blue-600"
            )}
          >
            View Profile
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "min-h-screen relative flex flex-col transition-colors duration-300",
      isDark ? "bg-gray-950" : "bg-gray-50"
    )}>
      <Toaster position="top-right" theme={isDark ? 'dark' : 'light'} />
      
      {/* Suspense boundary for search params handling */}
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              repeat: Infinity, 
              duration: 1,
              ease: "linear"
            }}
          >
            <Facebook className="h-8 w-8 text-blue-600" />
          </motion.div>
        </div>
      }>
        <SearchParamsHandler onTokenFound={handleTokenFound} />
      </Suspense>
      
      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Unified dark/light mode */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed inset-y-0 left-0 w-[280px] z-40 border-r",
              isDark 
                ? "bg-gray-950 border-gray-800" 
                : "bg-white border-gray-200"
            )}
          >
            <div className="flex flex-col h-full">
              {/* User Profile Section */}
                <div className={cn(
                "p-4 border-b",
                isDark ? "border-gray-800" : "border-gray-200"
                )}>
                <UserProfile />
                </div>

              {/* Pages List - Enhanced */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <h2 className={cn(
                    "text-sm font-semibold px-3 mb-4",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    YOUR PAGES
                  </h2>
                  {pages.map((page) => (
                    <motion.button
                      key={page.id}
                      onClick={() => handlePageSelect(page)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full p-3 flex items-center gap-3 rounded-lg transition-all border",
                        selectedPage?.id === page.id 
                          ? isDark 
                            ? "bg-blue-950/30 border-blue-800/50 text-blue-400"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                          : isDark
                            ? "hover:bg-gray-900/50 border-transparent text-gray-100"
                            : "hover:bg-gray-50 border-transparent text-gray-900"
                      )}
                    >
                      <div className="w-10 h-10 relative overflow-hidden rounded-full ring-2 ring-white/10">
                        <Image
                          src={page.picture.data.url}
                          alt={page.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className={cn(
                          "font-medium",
                          isDark 
                            ? selectedPage?.id === page.id ? "text-blue-400" : "text-gray-100"
                            : selectedPage?.id === page.id ? "text-blue-700" : "text-gray-900"
                        )}>
                          {page.name}
                        </div>
                        <div className={cn(
                          "text-xs",
                          isDark ? "text-gray-400" : "text-gray-500"
                        )}>
                          {page.fan_count.toLocaleString()} followers
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className={cn(
                "p-4 border-t",
                isDark ? "border-gray-800" : "border-gray-200"
              )}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors border",
                    isDark 
                      ? "text-red-400 hover:bg-red-950/30 border-red-900/30" 
                      : "text-red-600 hover:bg-red-50 border-red-200/50"
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className={cn(
          "sticky top-0 z-30 w-full border-b",
          isDark 
            ? "bg-gray-950/95 border-gray-800" 
            : "bg-white/95 border-gray-200"
        )}>
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-4">
              <MobileToggle />
              {selectedPage && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => window.open(`https://facebook.com/${selectedPage.id}`, '_blank')}
                className="w-8 h-8 relative overflow-hidden rounded-full ring-2 ring-offset-2 ring-blue-500 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Image
                  src={selectedPage.picture.data.url}
                  alt={selectedPage.name}
                  fill
                  className="object-cover"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view Facebook page</p>
            </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-4">
                <div>
              <h1 className={cn(
                "text-lg font-semibold flex items-center gap-2 cursor-pointer hover:text-blue-500 transition-colors",
                isDark ? "text-gray-100" : "text-gray-900"
              )}
                onClick={() => window.open(`https://facebook.com/${selectedPage.id}`, '_blank')}
              >
                {selectedPage.name}
                {selectedPage.fan_count > 10000 && (
                <TooltipProvider>
                  <Tooltip>
                <TooltipTrigger>
                <Badge variant="secondary">
                  Popular Page
                </Badge>
                </TooltipTrigger>
                <TooltipContent>
                <p>Click to view Facebook page</p>
                </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                )}
              </h1>
              <div className="flex items-center gap-2">
                <p className={cn(
                "text-sm",
                isDark ? "text-gray-400" : "text-gray-500"
                )}>
                {selectedPage.fan_count.toLocaleString()} followers
                </p>
                {selectedPage.tasks?.includes('MANAGE') && (
                <Badge variant="outline" className="text-xs">
                  Admin
                </Badge>
                )}
              </div>
                </div>
               
              </div>
            </div>
          </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!selectedPage ? (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
              ) : null}
              <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn(
            "p-2.5 rounded-lg transition-colors",
            isDark 
              ? "bg-gray-800 hover:bg-gray-700" 
              : "bg-gray-100 hover:bg-gray-200"
          )}
              >
          {isDark ? (
            <Sun className="h-5 w-5 text-gray-100" />
          ) : (
            <Moon className="h-5 w-5 text-gray-900" />
          )}
              </motion.button>
            </div>
            
          </div>
        </header>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 transition-all duration-300 p-6",
          isSidebarOpen ? "lg:pl-[300px]" : "lg:pl-6",
          isDark ? "bg-gray-950" : "bg-gray-50"
        )}>
          {!selectedPage ? (
            <NoPageSelected />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              {/* Dashboard Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={cn(
                  "border-border relative overflow-hidden",
                  isDark ? "bg-gray-900" : "bg-white"
                )}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={cn(
                      "text-sm font-medium",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      Total Conversations
                    </CardTitle>
                    <Mail className={cn(
                      "h-4 w-4",
                      isDark ? "text-blue-400" : "text-blue-600"
                    )} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={cn(
                        "text-2xl font-bold",
                        isDark ? "text-gray-100" : "text-gray-900"
                      )}>
                        {conversations.length}
                      </div>
                      <div className={cn(
                        "text-xs",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        Active message threads
                      </div>
                      {renderChart(getChartData())}
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  "border-border relative overflow-hidden",
                  isDark ? "bg-gray-900" : "bg-white"
                )}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={cn(
                      "text-sm font-medium",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      Unread Messages
                    </CardTitle>
                    <ChevronRight className={cn(
                      "h-4 w-4",
                      isDark ? "text-blue-400" : "text-blue-600"
                    )} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={cn(
                        "text-2xl font-bold",
                        isDark ? "text-gray-100" : "text-gray-900"
                      )}>
                        {conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0)}
                      </div>
                      <div className={cn(
                        "text-xs",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        Across all conversations
                      </div>
                      {renderChart(getChartData())}
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  "border-border relative overflow-hidden",
                  isDark ? "bg-gray-900" : "bg-white"
                )}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={cn(
                      "text-sm font-medium",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      Page Reach
                    </CardTitle>
                    <Users className={cn(
                      "h-4 w-4",
                      isDark ? "text-blue-400" : "text-blue-600"
                    )} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={cn(
                        "text-2xl font-bold",
                        isDark ? "text-gray-100" : "text-gray-900"
                      )}>
                        {selectedPage.fan_count.toLocaleString()}
                      </div>
                      <div className={cn(
                        "text-xs",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        Total page followers
                      </div>
                      {renderChart(getChartData())}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Message Visibility Toggle */}
              <MessageVisibilityToggle />

              {/* Enhanced Conversations Section */}
              <Card className={cn(
                "border-border shadow-md overflow-hidden",
                isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className={cn(
                    isDark ? "text-gray-100" : "text-gray-900"
                  )}>
                    Recent Conversations
                  </CardTitle>
                  <CardDescription className={cn(
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    Manage and reply to your recent message threads
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversations.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    conversations.map((conv) => (
                        <AnimatePresence key={conv.id}>
                        {showMessages && (
                          <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className={cn(
                            "rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300",
                            isDark 
                            ? "bg-gray-950 border border-gray-800" 
                            : "bg-white border border-gray-200"
                          )}
                          >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold">
                              {conv.participants.data[0].name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium">
                              {conv.participants.data[0].name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                              {conv.snippet}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(conv.updated_time).toLocaleString()}
                              </span>
                              {conv.unread_count > 0 && (
                                <Badge className={cn(
                                isDark ? "bg-blue-800 text-blue-100" : "bg-blue-100 text-blue-800"
                                )}>
                                {conv.unread_count} unread
                                </Badge>
                              )}
                              </div>
                            </div>
                            </div>
                            <Button
                            variant={isDark ? "outline" : "default"}
                            size="sm"
                            onClick={() => {
                              setSelectedConversation(conv);
                              setIsMessageModalOpen(true);
                            }}
                            disabled={!conv.can_reply}
                            className={cn(
                              "transition-all",
                              !conv.can_reply && isDark
                              ? "opacity-50 cursor-not-allowed" 
                              : ""
                            )}
                            >
                            <Send className="h-4 w-4 mr-2" />
                            Reply
                            </Button>
                          </div>
                          </motion.div>
                        )}
                        </AnimatePresence>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Bulk Messaging Section */}

              <Card className={cn(
                "border-border shadow-lg",
                isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"
              )}>
                <CardHeader className={cn(
                  "border-b",
                  isDark ? "border-gray-800" : "border-gray-200"
                )}>
                  <CardTitle className={isDark ? "text-gray-100" : "text-gray-900"}>
                    Bulk Message Campaign
                  </CardTitle>
                  <CardDescription className={isDark ? "text-gray-400" : "text-gray-500"}>
                    Send messages to multiple recipients at once
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 mt-6">
                  {/* Step 1: Select Recipients */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className={cn(
                      "rounded-lg p-6",
                      isDark ? "bg-gray-950 border border-gray-800" : "bg-gray-50 border border-gray-200"
                    )}
                  >
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      Step 1: Select Recipients
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <Button
                        onClick={() => setSelectedRecipients(
                          selectedRecipients.length === conversations.length 
                            ? [] 
                            : conversations.map(c => c.participants.data[0].id)
                        )}
                        variant={selectedRecipients.length === conversations.length ? "default" : "outline"}
                        className={cn(
                          "transition-colors",
                          selectedRecipients.length === conversations.length
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : isDark
                              ? "bg-transparent border-gray-800 text-gray-100 hover:bg-gray-800 hover:text-gray-100"
                              : "bg-transparent border-gray-200 text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        {selectedRecipients.length === conversations.length 
                          ? `Deselect All Recipients (${conversations.length})`
                          : `Select All Recipients (${conversations.length})`
                        }
                      </Button>
                        {selectedRecipients.length > 0 && (
                        <Badge 
                          variant="outline" 
                          className="bg-blue-900/30 text-blue-400 border-blue-800"
                        >
                          {selectedRecipients.length} selected
                        </Badge>
                        )}
                    </div>
                  </motion.section>
      
                  {/* Step 2: Message Type */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className={cn(
                      "rounded-lg p-6",
                      isDark ? "bg-gray-950 border border-gray-800" : "bg-gray-50 border border-gray-200"
                    )}
                  >
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      Step 2: Message Type
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                      <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedTag === 'CONFIRMED_EVENT_UPDATE' ? "default" : "outline"}
                          onClick={() => setSelectedTag('CONFIRMED_EVENT_UPDATE')}
                          className={cn(
                            "w-full transition-colors font-medium flex items-center justify-center gap-2",
                            selectedTag === 'CONFIRMED_EVENT_UPDATE'
                              ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                              : isDark
                                ? "bg-transparent border-gray-800 text-gray-100 hover:bg-gray-800"
                                : "bg-transparent border-gray-200 text-gray-900 hover:bg-gray-100"
                          )}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 7h-7" />
                            <path d="M14 17H5" />
                            <circle cx="17" cy="17" r="3" />
                            <circle cx="7" cy="7" r="3" />
                          </svg>
                          Event Update
                        </Button>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedTag === 'POST_PURCHASE_UPDATE' ? "default" : "outline"}
                          onClick={() => setSelectedTag('POST_PURCHASE_UPDATE')}
                          className={cn(
                            "w-full transition-colors font-medium flex items-center justify-center gap-2",
                            selectedTag === 'POST_PURCHASE_UPDATE'
                              ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                              : isDark
                                ? "bg-transparent border-gray-800 text-gray-100 hover:bg-gray-800"
                                : "bg-transparent border-gray-200 text-gray-900 hover:bg-gray-100"
                          )}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 7h-7" />
                            <path d="M14 17H5" />
                            <circle cx="17" cy="17" r="3" />
                            <circle cx="7" cy="7" r="3" />
                          </svg>
                          Purchase Update
                        </Button>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedTag === 'ACCOUNT_UPDATE' ? "default" : "outline"}
                          onClick={() => setSelectedTag('ACCOUNT_UPDATE')}
                          className={cn(
                            "w-full transition-colors font-medium flex items-center justify-center gap-2",
                            selectedTag === 'ACCOUNT_UPDATE'
                              ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                              : isDark
                                ? "bg-transparent border-gray-800 text-gray-100 hover:bg-gray-800"
                                : "bg-transparent border-gray-200 text-gray-900 hover:bg-gray-100"
                          )}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 7h-7" />
                            <path d="M14 17H5" />
                            <circle cx="17" cy="17" r="3" />
                            <circle cx="7" cy="7" r="3" />
                          </svg>
                          Account Update
                        </Button>
                      </motion.div>
                    </div>
                  </motion.section>
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className={cn(
                      "rounded-lg p-6",
                      isDark ? "bg-gray-950 border border-gray-800" : "bg-gray-50 border border-gray-200"
                    )}
                  >
                 <h2 className={cn(
                    "text-lg font-semibold mb-4",
                    isDark ? "text-gray-100" : "text-gray-900"
                  )}>
                    Step 3: Write Message
                  </h2>
                  <div className="space-y-4">
                      <Textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Write your message here..."
                        className={cn(
                          "min-h-[100px]",
                          isDark 
                            ? "bg-black border-gray-800 text-gray-100 placeholder:text-gray-500" 
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                        )}
                      />
                      <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleBulkSend}
                          disabled={!messageText || selectedRecipients.length === 0 || sendingMessages}
                          className={cn(
                            "w-full transition-all",
                            !messageText || selectedRecipients.length === 0 || sendingMessages
                              ? "opacity-50 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          {sendingMessages ? (
                            <span className="flex items-center justify-center">
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 1,
                                  ease: "linear"
                                }}
                                className="mr-2"
                              >
                                <Send className="h-4 w-4" />
                              </motion.span>
                              Sending...
                            </span>
                          ) : (
                            'Send Messages'
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.section>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>

      {/* Enhanced Dialog */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className={cn(
          "sm:max-w-[500px]",
          isDark 
            ? "bg-gray-950 border-gray-800" 
            : "bg-white border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle>
              Send Message to {selectedConversation?.participants.data[0].name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant={isDark ? "outline" : "default"}
              onClick={() => setIsMessageModalOpen(false)} 
              className={isDark ? "border-gray-700 hover:bg-gray-800" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyMessage.trim() || sendingMessages}
              className={cn(
                "transition-all",
                !replyMessage.trim() || sendingMessages
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {sendingMessages ? (
                <span className="flex items-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1,
                      ease: "linear"
                    }}
                    className="mr-2"
                  >
                    <Send className="h-4 w-4" />
                  </motion.span>
                  Sending...
                </span>
              ) : (
                'Send'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}