'use client'

import { JSX, useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Sun, Moon, LogOut, Facebook, ChevronRight } from 'lucide-react';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { getPages, type FacebookPage, type Conversation } from '@/lib/facebook';
import { useAuthStore } from '@/store/auth';
import { decryptToken } from '@/lib/encryption';
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

// Create a separate component for handling search params
const SearchParamsHandler = ({ onTokenFound }: { onTokenFound: (token: string) => void }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('Token');
    if (token) {
      localStorage.setItem('fb_access_token', token);
      onTokenFound(token);
    } else {
      // Check local storage
      const storedToken = localStorage.getItem('fb_access_token');
      if (storedToken) {
        onTokenFound(storedToken);
      } else {
        router.replace('/');
      }
    }
  }, [searchParams, router, onTokenFound]);

  return null;
};

interface MessageTag {
  value: 'CONFIRMED_EVENT_UPDATE' | 'POST_PURCHASE_UPDATE' | 'ACCOUNT_UPDATE';
  label: string;
}

export default function Dashboard(): JSX.Element {
  const fetchPages = useCallback(async (token: string) => {
    try {
      const pageList = await getPages(token);
      setPages(pageList);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  }, []);

  // State declarations
  const { theme, setTheme } = useTheme();
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
  const router = useRouter();
  const { setToken } = useAuthStore();
  const { logout } = useFacebookAuth();

  // Theme initialization
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handlelogout function
  const handleLogout = useCallback(async () => {
    try {
      setPages([]);
      setToken('');

      // Perform logout through service
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/');
    }
  }, [setPages, setToken, logout, router]);

  // Handle token found callback
  const handleTokenFound = useCallback((token: string) => {
    fetchPages(token);
  }, [fetchPages]);

  // Data initialization
  useEffect(() => {
    const init = async () => {
      try {
        if (window.location.hash === '#_=_') {
          history.replaceState({}, document.title, window.location.href.split('#')[0]);
        }

        const storedToken = Cookies.get('fb_token');
        if (storedToken) {
          const decodedToken = decryptToken(storedToken);
          await fetchPages(decodedToken);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        handleLogout();
      }
    };

    init();
  }, [handleLogout, fetchPages]);

  // Resize effect
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

  // Prevent hydration issues
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
  const NoPageSelected = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-8 shadow-lg text-center max-w-md w-full"
      >
        <Facebook className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">
          Select a Page to Message
        </h2>
        <p className="mb-6 text-muted-foreground">
          Choose a Facebook page from the sidebar to view conversations and send messages.
        </p>
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-muted-foreground"
        >
          <ChevronRight className="h-6 w-6 transform -rotate-90" />
        </motion.div>
      </motion.div>
    </div>
  );

  const messageTags: MessageTag[] = [
    { value: 'CONFIRMED_EVENT_UPDATE', label: 'Event Update' },
    { value: 'POST_PURCHASE_UPDATE', label: 'Purchase Update' },
    { value: 'ACCOUNT_UPDATE', label: 'Account Update' }
  ];

  // Mobile toggle button for sidebar
  const MobileToggle = () => (
    <button
      onClick={() => setSidebarOpen(!isSidebarOpen)}
      className="lg:hidden p-2 rounded-lg bg-background border border-border hover:bg-secondary transition-colors"
      aria-label="Toggle sidebar"
    >
      <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background relative flex flex-col transition-colors duration-300">
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

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-card shadow-lg z-40"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Facebook className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold">Messages</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {pages.map((page) => (
                    <motion.button
                      key={page.id}
                      onClick={() => handlePageSelect(page)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full p-3 flex items-center gap-3 rounded-lg transition-all",
                        selectedPage?.id === page.id 
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                          : "hover:bg-secondary"
                      )}>
                      <div className="w-10 h-10 relative overflow-hidden rounded-full">
                        <Image
                          src={page.picture.data.url}
                          alt={page.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{page.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {page.fan_count.toLocaleString()} followers
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex h-16 items-center gap-4 px-4">
            <MobileToggle />
            <div className="flex-1" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "bg-white/10 hover:bg-white/20 text-yellow-400" 
                  : "bg-gray-800 hover:bg-gray-900 text-yellow-400"
              )}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300 px-4 py-6",
          isSidebarOpen ? "lg:pl-[300px]" : "lg:pl-4"
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
              {/* Page Header */}
              <div className="flex flex-col gap-4 bg-card rounded-lg p-4 shadow-sm border border-border">
                <div>
                  <h1 className="text-xl font-bold">
                    {selectedPage.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedPage.fan_count.toLocaleString()} followers
                  </p>
                </div>
                <Button
                  variant={isDark ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowMessages(!showMessages)}
                  className="flex items-center gap-2 w-fit"
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
              </div>
              
              {showMessages && (
                <div className="text-sm text-muted-foreground">
                  Showing {conversations.length} conversations
                </div>
              )}

              {/* Conversations List - Collapsible */}
              <AnimatePresence>
                {showMessages && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-4"
                  >
                    {conversations.length === 0 ? (
                      <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">No conversations found for this page</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.01 }}
                          className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
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
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bulk Message Controls */}
              <div className="space-y-6">
                {/* Step 1: Select Recipients */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Step 1: Select Recipients
                  </h2>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setSelectedRecipients(conversations.map((c) => c.participants.data[0].id))}
                      variant={isDark ? "outline" : "default"}
                      className={cn(
                        isDark ? "hover:bg-gray-800" : "hover:bg-gray-200",
                        "transition-colors"
                      )}
                    >
                      Select All Recipients ({conversations.length})
                    </Button>
                    {selectedRecipients.length > 0 && (
                      <Badge variant={isDark ? "outline" : "secondary"} className="px-3 py-1">
                        {selectedRecipients.length} selected
                      </Badge>
                    )}
                  </div>
                </motion.section>
                
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Step 2: Message Type
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {messageTags.map((tag) => (
                      <motion.div key={tag.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          variant={selectedTag === tag.value ? "default" : isDark ? "outline" : "default"}
                          onClick={() => setSelectedTag(tag.value)}
                          className={cn(
                            "w-full transition-colors",
                            selectedTag === tag.value
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : isDark 
                                ? "hover:bg-gray-800" 
                                : "hover:bg-gray-200"
                          )}
                        >
                          {tag.label}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>

                {/* Step 3: Write Message */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Step 3: Write Message
                  </h2>
                  <div className="space-y-4">
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Write your message here..."
                      className="min-h-[100px]"
                    />
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={handleBulkSend}
                        disabled={!messageText || selectedRecipients.length === 0 || sendingMessages}
                        className={cn(
                          "transition-all",
                          !messageText || selectedRecipients.length === 0 || sendingMessages
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
                          'Send Messages'
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}
        </main>

        {/* Message Modal */}
        <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
          <DialogContent className={isDark ? "border-gray-700 bg-gray-900" : ""}>
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
    </div>
  );
}