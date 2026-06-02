
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, getGravatarUrl } from '@/lib/utils';

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  SidebarInset, 
  SidebarFooter 
} from '@/components/ui/sidebar';
import { 
  Search, 
  BookOpen, 
  Loader2,
  Sun,
  Moon,
  Globe,
  Network,
  Milestone,
  Settings,
  LogOut,
  History,
  Library,
  Sparkles,
  Mic,
  LayoutDashboard,
  MessageSquare,
  ShieldAlert,
  GraduationCap,
  Highlighter,
  Link2,
  Newspaper,
  PenTool,
  CheckCircle2,
  Clock,
  BookMarked,
  ArrowLeftRight,
  ShieldCheck,
  FileText,
  Tags,
  Filter,
  X,
  Eye,
  Edit3,
  Book,
  User as UserIcon,
  Save,
  Camera,
  Award,
  AlertTriangle,
  Info,
  Server,
  Key,
  Send
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { transcribeAudio } from '@/ai/flows/transcribe-flow';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';

type ViewMode = 'dashboard' | 'lexicon' | 'wiki' | 'blog' | 'blog-designer' | 'theology-map' | 'timeline' | 'writing-assistant' | 'academic-integrity' | 'ai-settings' | 'ai-assistant' | 'verse-explorer' | 'compare-translations' | 'research-library' | 'moderation' | 'profile';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  credentials?: string;
  bio?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isTrustedContributor?: boolean;
  preferences?: {
    modelProvider?: 'google' | 'local';
    selectedModel?: string;
    customApiKey?: string;
    preferredBibleVersion?: string;
    language?: string;
  };
}

interface WikiArticle {
  id: string;
  title: string;
  content: string;
  worksCited: string;
  status: 'pending' | 'approved' | 'rejected';
  authorUid: string;
  authorName: string;
  createdAt: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  authorUid: string;
  authorName: string;
  createdAt: string;
  tags?: string[];
}

interface BlogComment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorCredentials: string;
  content: string;
  createdAt: string;
}

const BLOG_CATEGORIES = ["Linguistics", "Theology", "History", "Archaeology", "Hermeneutics", "General"];

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
  const escaped = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const isMatch = highlights.some(h => h.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-accent/40 text-inherit rounded px-0.5">{part}</mark>
        ) : part;
      })}
    </p>
  );
}

export default function Home() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [systemApiKey, setSystemApiKey] = useState<string | null>(null);
  const [localModels, setLocalModels] = useState<string[]>([]);

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [localDocuments, setLocalDocuments] = useState<IDBDocument[]>([]);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);

  const [aiPrefs, setAiPrefs] = useState({
    modelProvider: 'google',
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: '',
    preferredBibleVersion: 'kjv',
    language: language
  });

  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [assistantTerm, setAssistantTerm] = useState('');

  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [theoResult, setTheoResult] = useState<TheologicalConceptOutput | null>(null);
  const [timelineResult, setTimelineResult] = useState<HistoricalTimelineOutput | null>(null);
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);

  const [activeHighlights, setActiveHighlights] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Profile Edit State
  const [profileDraft, setProfileDraft] = useState({ displayName: '', credentials: '', bio: '', photoURL: '' });

  // Wiki State
  const [wikiDraft, setWikiDraft] = useState({ title: '', content: '', worksCited: '' });
  const wikiQuery = useMemo(() => query(collection(db, 'wiki_entries'), orderBy('createdAt', 'desc')), [db]);
  const { data: wikiArticles } = useCollection<WikiArticle>(wikiQuery);

  // Blog State
  const [blogDraft, setBlogDraft] = useState({ title: '', excerpt: '', content: '', category: 'General', tagInput: '' });
  const [blogFilter, setBlogFilter] = useState({ category: 'All', tag: '' });
  const [blogDesignerTab, setBlogDesignerTab] = useState<'editor' | 'preview'>('editor');
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const blogQuery = useMemo(() => {
    return query(collection(db, 'blog_posts'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: rawBlogPosts } = useCollection<BlogPost>(blogQuery);

  const filteredBlogPosts = useMemo(() => {
    return rawBlogPosts.filter(post => {
      const categoryMatch = blogFilter.category === 'All' || post.category === blogFilter.category;
      const tagMatch = !blogFilter.tag || post.tags?.some(tag => tag.toLowerCase().includes(blogFilter.tag.toLowerCase()));
      return categoryMatch && tagMatch;
    });
  }, [rawBlogPosts, blogFilter]);

  // Dynamic Comment Query
  const commentsQuery = useMemoFirebase(() => {
    if (!db || !selectedBlogPost) return null;
    return query(collection(db, 'blog_posts', selectedBlogPost.id, 'comments'), orderBy('createdAt', 'asc'));
  }, [db, selectedBlogPost]);

  const { data: activeComments } = useCollection<BlogComment>(commentsQuery);

  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    rawBlogPosts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [rawBlogPosts]);

  // Moderation State
  const pendingWikiQuery = useMemo(() => query(collection(db, 'wiki_entries'), where('status', '==', 'pending')), [db]);
  const { data: pendingArticles } = useCollection<WikiArticle>(pendingWikiQuery);
  const pendingBlogQuery = useMemo(() => query(collection(db, 'blog_posts'), where('status', '==', 'pending')), [db]);
  const { data: pendingBlogPosts } = useCollection<BlogPost>(pendingBlogQuery);

  const refreshLocalDocs = useCallback(async () => {
    const docs = await getAllLocalDocuments();
    setLocalDocuments(docs);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    refreshLocalDocs();
    getVersions().then(setAvailableVersions);

    // Check system config for AI readiness and local models
    async function checkSystemConfig() {
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      if (configSnap.exists()) {
        const config = configSnap.data();
        setLocalModels(config.localModelList || ['llama3', 'mistral', 'gemma']);
        setSystemApiKey(config.geminiApiKey || null);
        if (!config.geminiApiKey) {
          setIsAiEnabled(false);
        } else {
          setIsAiEnabled(true);
        }
      } else {
        setIsAiEnabled(false);
      }
    }
    checkSystemConfig();
  }, [refreshLocalDocs, db]);

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
          setProfileDraft({
            displayName: data.displayName || '',
            credentials: data.credentials || '',
            bio: data.bio || '',
            photoURL: data.photoURL || ''
          });
          if (data.preferences) {
            setAiPrefs({
              modelProvider: data.preferences.modelProvider || 'google',
              selectedModel: data.preferences.selectedModel || 'googleai/gemini-2.5-flash',
              customApiKey: data.preferences.customApiKey || '',
              preferredBibleVersion: data.preferences.preferredBibleVersion || 'kjv',
              language: data.preferences.language || language
            });
            if (data.preferences.customApiKey) {
              setIsAiEnabled(true);
            }
          }
        }
      });
      return () => unsub();
    }
  }, [user, db, language]);

  const effectiveApiKey = aiPrefs.customApiKey || systemApiKey;

  const handleSearch = async (term: string, type: ViewMode) => {
    if (!term.trim()) return;
    
    if (!effectiveApiKey && aiPrefs.modelProvider === 'google' && ['lexicon', 'theology-map', 'timeline', 'ai-assistant', 'verse-explorer', 'writing-assistant', 'academic-integrity'].includes(type)) {
      toast({ 
        variant: 'destructive', 
        title: "AI Configuration Required", 
        description: "Please provide your own Gemini API Key in your profile or ask an administrator to configure the system key." 
      });
      return;
    }

    setIsLoading(true);
    setActiveTab(type);
    setActiveHighlights([]);
    logSearch(db, term, type, user?.uid);
    try {
      let result;
      const effectiveModel = aiPrefs.modelProvider === 'local' ? `ollama/${aiPrefs.selectedModel}` : aiPrefs.selectedModel;
      
      if (type === 'lexicon') {
        result = await defineAndAnalyzeTerm({ strongsNumber: term, model: effectiveModel });
        setLexiconResult(result);
      } else if (type === 'theology-map') {
        result = await analyzeTheologicalConcept({ concept: term });
        setTheoResult(result);
      } else if (type === 'timeline') {
        result = await generateHistoricalTimeline({ topic: term });
        setTimelineResult(result);
      } else if (type === 'ai-assistant') {
        const researchContext = localDocuments.map(d => d.content);
        result = await aiStudyAssistant({ term, researchContext });
        setAssistantResult(result);
      }

      const newHistory = [{id: Date.now().toString(), type, term, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory.slice(0, 10)));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Search failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileDraft.displayName,
        credentials: profileDraft.credentials,
        bio: profileDraft.bio,
        photoURL: profileDraft.photoURL
      });
      toast({ title: "Profile Updated", description: "Your scholarly credentials have been saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAiPreferences = async (newPrefs: any) => {
    if (!user || !db) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        preferences: {
          ...userProfile?.preferences,
          ...newPrefs
        }
      });
      setAiPrefs({...aiPrefs, ...newPrefs});
      toast({ title: "Preferences Saved", description: "Your research engine settings have been updated." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to save preferences" });
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { 
          uid: result.user.uid, 
          displayName: result.user.displayName, 
          email: result.user.email,
          photoURL: '',
          isAdmin: false,
          isModerator: false,
          isTrustedContributor: false,
          preferences: {
            modelProvider: 'google',
            selectedModel: 'googleai/gemini-2.5-flash',
            customApiKey: ''
          }
        });
      }
      toast({ title: "Logged in", description: `Welcome, ${result.user.displayName}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    toast({ title: "Logged out" });
    setActiveTab('dashboard');
  };

  const submitWikiEntry = async () => {
    if (!user || !wikiDraft.title || !wikiDraft.content) return;
    setIsLoading(true);
    try {
      const status = userProfile?.isTrustedContributor ? 'approved' : 'pending';
      await addDoc(collection(db, 'wiki_entries'), {
        ...wikiDraft,
        status: status,
        authorUid: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Scholar',
        createdAt: new Date().toISOString()
      });
      setWikiDraft({ title: '', content: '', worksCited: '' });
      toast({ 
        title: status === 'approved' ? "Article Published" : "Submission Sent", 
        description: status === 'approved' ? "Your article is live on the wiki." : "Your article is awaiting scholarly peer review." 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: "Submission failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const submitBlogPost = async () => {
    if (!user || !blogDraft.title || !blogDraft.content) return;
    
    if (!userProfile?.photoURL) {
      toast({ 
        variant: 'destructive', 
        title: "Scholarly Photo Required", 
        description: "To maintain academic accountability, researchers must have a verified profile photo before publishing to the Journal." 
      });
      setActiveTab('profile');
      return;
    }

    setIsLoading(true);
    try {
      const status = userProfile?.isAdmin || userProfile?.isTrustedContributor ? 'approved' : 'pending';
      const tags = blogDraft.tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      await addDoc(collection(db, 'blog_posts'), {
        title: blogDraft.title,
        content: blogDraft.content,
        excerpt: blogDraft.excerpt,
        category: blogDraft.category,
        tags: tags,
        status: status,
        authorUid: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Scholar',
        createdAt: new Date().toISOString()
      });
      
      setBlogDraft({ title: '', excerpt: '', content: '', category: 'General', tagInput: '' });
      toast({ 
        title: status === 'approved' ? "Post Published" : "Post Submitted", 
        description: status === 'approved' ? "Your post is now live in the journal." : "Your post is awaiting review." 
      });
      setActiveTab('blog');
    } catch (e) {
      toast({ variant: 'destructive', title: "Blog submission failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!user || !selectedBlogPost || !commentInput.trim()) return;
    
    try {
      const commentsRef = collection(db, 'blog_posts', selectedBlogPost.id, 'comments');
      await addDoc(commentsRef, {
        postId: selectedBlogPost.id,
        authorUid: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Scholar',
        authorCredentials: userProfile?.credentials || '',
        content: commentInput.trim(),
        createdAt: new Date().toISOString()
      });
      setCommentInput('');
      toast({ title: "Comment Posted", description: "Your contribution has been added to the dialogue." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Comment failed" });
    }
  };

  const moderateContent = async (id: string, collectionName: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, collectionName, id), { status });
      toast({ title: `Content ${status}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Moderation action failed" });
    }
  };

  const handleVoiceSearch = async () => {
    if (!effectiveApiKey && aiPrefs.modelProvider === 'google') {
      toast({ variant: 'destructive', title: "Voice features require AI configuration." });
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      setIsLoading(true);
      try {
        const res = await transcribeAudio({ audioPart: "SGVsbG8gV29ybGQ=" }); 
        setSidebarSearchTerm(res.transcript);
        handleSearch(res.transcript, 'ai-assistant');
      } catch (e) {
        toast({ variant: 'destructive', title: "Voice transcription failed" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsRecording(true);
      toast({ title: "Listening..." });
    }
  };

  if (!mounted) return null;

  const hasDesignerAccess = userProfile?.isAdmin || userProfile?.isModerator || userProfile?.isTrustedContributor;
  const effectiveAvatar = userProfile?.photoURL || (user?.email ? getGravatarUrl(user.email) : '');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md"><Globe className="h-6 w-6" /></div>
              <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">{t.app_title}</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Dashboard">
                    <LayoutDashboard className="h-5 w-5" /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'wiki'} onClick={() => setActiveTab('wiki')} tooltip="Scholarly Wiki">
                    <GraduationCap className="h-5 w-5" /> <span>Scholarly Wiki</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'blog'} onClick={() => setActiveTab('blog')} tooltip="Scholar's Journal">
                    <Newspaper className="h-5 w-5" /> <span>Scholar's Journal</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                AI Research Hub
                {!effectiveApiKey && aiPrefs.modelProvider === 'google' && <Badge variant="destructive" className="scale-75 origin-right">OFF</Badge>}
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} tooltip="Study Assistant" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <Sparkles className="h-5 w-5" /> <span>Study Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'lexicon'} onClick={() => setActiveTab('lexicon')} tooltip="Lexicon Analysis" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <BookOpen className="h-5 w-5" /> <span>Lexicon</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'theology-map'} onClick={() => setActiveTab('theology-map')} tooltip="Theology Concept Map" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <Network className="h-5 w-5" /> <span>Theology Map</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} tooltip="Historical Timeline" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <Milestone className="h-5 w-5" /> <span>Historical Timeline</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Linguistic Analysis</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'verse-explorer'} onClick={() => setActiveTab('verse-explorer')} tooltip="Verse Explorer" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <BookMarked className="h-5 w-5" /> <span>Verse Explorer</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'compare-translations'} onClick={() => setActiveTab('compare-translations')} tooltip="Translation Comparison">
                    <ArrowLeftRight className="h-5 w-5" /> <span>Compare Versions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Synthesis & Library</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'research-library'} onClick={() => setActiveTab('research-library')} tooltip="Research Library">
                    <Library className="h-5 w-5" /> <span>Research Library</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {hasDesignerAccess && (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeTab === 'blog-designer'} onClick={() => setActiveTab('blog-designer')} tooltip="Journal Designer">
                      <PenTool className="h-5 w-5" /> <span>Journal Designer</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'writing-assistant'} onClick={() => setActiveTab('writing-assistant')} tooltip="Writing Assistant" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <Edit3 className="h-5 w-5" /> <span>Writing Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'academic-integrity'} onClick={() => setActiveTab('academic-integrity')} tooltip="Integrity Checker" disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}>
                    <ShieldCheck className="h-5 w-5" /> <span>Academic Integrity</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {userProfile?.isModerator && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} tooltip="Peer Review">
                      <ShieldAlert className="h-5 w-5 text-accent" /> <span>Peer Review</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t flex flex-col gap-2">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center gap-1">
                {(userProfile?.isAdmin || !user) && (
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8"
                     onClick={() => window.open('/admin/settings', '_blank')}
                   >
                     <Settings className="h-4 w-4" />
                   </Button>
                )}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
                        <Avatar className="h-full w-full">
                          <AvatarImage src={effectiveAvatar} />
                          <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span>{userProfile?.displayName || user.displayName}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{userProfile?.credentials}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                        <UserIcon className="h-4 w-4 mr-2" /> My Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogin}>Login</Button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main id="main-content" className="container max-w-5xl mx-auto py-10 px-6 min-h-screen">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <header>
                    <h1 className="text-4xl font-bold font-headline">Research Workspace</h1>
                    <p className="text-muted-foreground text-lg">Integrated AI for advanced biblical scholarship.</p>
                  </header>

                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                          <Sparkles className={cn("h-5 w-5", effectiveApiKey || aiPrefs.modelProvider === 'local' ? "text-primary" : "text-muted-foreground")} /> Scholarly Workspace
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder={effectiveApiKey || aiPrefs.modelProvider === 'local' ? "Greek/Hebrew term or eschatological question..." : "AI Features Restricted - Please add your API Key"}
                            value={assistantTerm} 
                            disabled={!effectiveApiKey && aiPrefs.modelProvider === 'google'}
                            onChange={e => setAssistantTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')}
                          />
                          <Button onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading || (!effectiveApiKey && aiPrefs.modelProvider === 'google')}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" /> Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[200px]">
                          {history.map(h => (
                            <div key={h.id} className="p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer text-xs" onClick={() => handleSearch(h.term, h.type as any)}>
                              <p className="font-bold truncate">{h.term}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{h.type.replace('-', ' ')}</p>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'blog' && (
                <div className="space-y-8">
                  <header className="flex justify-between items-center border-b pb-6">
                    <div>
                      <h1 className="text-3xl font-bold font-headline">Scholar's Journal</h1>
                      <p className="text-muted-foreground">Peer-reviewed reflections and academic discoveries.</p>
                    </div>
                    {hasDesignerAccess && (
                      <Button variant="outline" onClick={() => setActiveTab('blog-designer')}>
                        <PenTool className="h-4 w-4 mr-2" /> Write for Journal
                      </Button>
                    )}
                  </header>

                  <div className="grid gap-8 md:grid-cols-4">
                    <aside className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Filter className="h-4 w-4" /> Categories
                        </h3>
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant={blogFilter.category === 'All' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="justify-start" 
                            onClick={() => setBlogFilter({...blogFilter, category: 'All'})}
                          >
                            All Categories
                          </Button>
                          {BLOG_CATEGORIES.map(cat => (
                            <Button 
                              key={cat}
                              variant={blogFilter.category === cat ? 'secondary' : 'ghost'} 
                              size="sm" 
                              className="justify-start" 
                              onClick={() => setBlogFilter({...blogFilter, category: cat})}
                            >
                              {cat}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Tags className="h-4 w-4" /> Popular Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {allAvailableTags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant={blogFilter.tag === tag ? 'default' : 'outline'} 
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => setBlogFilter({...blogFilter, tag: blogFilter.tag === tag ? '' : tag})}
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </aside>

                    <div className="md:col-span-3 space-y-6">
                      {selectedBlogPost ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedBlogPost(null)} className="mb-4">
                            <X className="h-4 w-4 mr-2" /> Back to Journal
                          </Button>
                          <article className="prose prose-stone dark:prose-invert max-w-none">
                            <Badge className="mb-4">{selectedBlogPost.category}</Badge>
                            <h1 className="text-4xl font-bold font-headline mb-4">{selectedBlogPost.title}</h1>
                            <div className="flex items-center gap-4 mb-8 text-muted-foreground text-sm border-b pb-4">
                              <span>By {selectedBlogPost.authorName}</span>
                              <span>•</span>
                              <span>{new Date(selectedBlogPost.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-lg mb-8">
                              {selectedBlogPost.content}
                            </div>
                          </article>

                          <Separator />

                          <section className="space-y-6 pt-8">
                            <h3 className="text-2xl font-bold font-headline flex items-center gap-2">
                              <MessageSquare className="h-6 w-6 text-primary" /> 
                              Academic Dialogue ({activeComments?.length || 0})
                            </h3>

                            {user ? (
                              <Card className="border-primary/20 bg-muted/30">
                                <CardContent className="p-4 space-y-4">
                                  <Textarea 
                                    placeholder="Add to the scholarly discussion..." 
                                    value={commentInput}
                                    onChange={e => setCommentInput(e.target.value)}
                                    className="bg-background min-h-[100px]"
                                  />
                                  <div className="flex justify-end">
                                    <Button onClick={handlePostComment} disabled={!commentInput.trim()}>
                                      <Send className="h-4 w-4 mr-2" /> Post Contribution
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>Please log in to participate in academic dialogue.</AlertDescription>
                              </Alert>
                            )}

                            <div className="space-y-4 mt-8">
                              {activeComments?.map(comment => (
                                <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-card border animate-in slide-in-from-left-4 duration-300">
                                  <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={getGravatarUrl(comment.authorUid)} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{comment.authorName}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{comment.authorCredentials}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                              {activeComments?.length === 0 && (
                                <p className="text-center text-muted-foreground italic text-sm py-12">No scholarly reflections yet. Be the first to contribute.</p>
                              )}
                            </div>
                          </section>
                        </div>
                      ) : (
                        <div className="grid gap-6">
                          {filteredBlogPosts.map(post => (
                            <Card key={post.id} className="hover:shadow-lg transition-all border-primary/5 cursor-pointer group" onClick={() => setSelectedBlogPost(post)}>
                              <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="secondary">{post.category}</Badge>
                                  <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                                <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
                                <CardDescription className="text-sm line-clamp-2 mt-2">{post.excerpt}</CardDescription>
                              </CardHeader>
                              <CardFooter className="flex justify-between items-center border-t pt-4">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={getGravatarUrl(post.authorUid)} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                  </Avatar>
                                  <span>{post.authorName}</span>
                                </div>
                                <Button variant="link" size="sm" className="p-0 h-auto font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  Read Full Article <Eye className="h-3 w-3" />
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                          {filteredBlogPosts.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed rounded-xl space-y-4">
                              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                              <h3 className="font-bold font-headline text-xl">No Journal Entries Found</h3>
                              <p className="text-muted-foreground">Try adjusting your taxonomy filters.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ... Other Tabs stay the same ... */}
              {activeTab === 'profile' && userProfile && (
                <div className="space-y-8">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Scholarly Profile</h1>
                    <p className="text-muted-foreground">Manage your academic identity and personal research credentials.</p>
                  </header>

                  <div className="grid gap-8 md:grid-cols-3">
                    <Card className="md:col-span-1 shadow-lg border-primary/10 h-fit">
                      <CardHeader className="text-center pb-2">
                        <div className="relative mx-auto w-32 h-32 mb-4 group">
                          <Avatar className="w-full h-full border-4 border-background shadow-xl">
                            <AvatarImage src={effectiveAvatar} />
                            <AvatarFallback><UserIcon className="h-12 w-12" /></AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="text-white h-6 w-6" />
                          </div>
                        </div>
                        <CardTitle className="font-headline">{userProfile.displayName}</CardTitle>
                        <CardDescription className="flex items-center justify-center gap-2">
                          <Award className="h-3 w-3 text-accent" /> {userProfile.credentials || "Awaiting Credentials"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {userProfile.bio || "No scholarly bio added yet."}
                        </p>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-2 border-t pt-4">
                        <div className="w-full flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                          <span>Account Status</span>
                          <span className="text-primary">{userProfile.isAdmin ? "Administrator" : userProfile.isModerator ? "Moderator" : userProfile.isTrustedContributor ? "Trusted Contributor" : "Scholar"}</span>
                        </div>
                      </CardFooter>
                    </Card>

                    <div className="md:col-span-2 space-y-8">
                      <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                          <CardTitle className="text-xl font-headline">Identity & Credentials</CardTitle>
                          <CardDescription>Update your public information for wiki and journal contributions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Full Name</Label>
                              <Input value={profileDraft.displayName} onChange={e => setProfileDraft({...profileDraft, displayName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>Academic Credentials</Label>
                              <Input placeholder="e.g. PhD Candidate" value={profileDraft.credentials} onChange={e => setProfileDraft({...profileDraft, credentials: e.target.value})} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Photo URL</Label>
                            <Input placeholder="https://..." value={profileDraft.photoURL} onChange={e => setProfileDraft({...profileDraft, photoURL: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Scholarly Biography</Label>
                            <Textarea rows={4} placeholder="Research focus and background..." value={profileDraft.bio} onChange={e => setProfileDraft({...profileDraft, bio: e.target.value})} />
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex justify-end">
                           <Button onClick={updateProfile} disabled={isLoading}>
                             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                             Save Identity
                           </Button>
                        </CardFooter>
                      </Card>

                      <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                          <CardTitle className="text-xl font-headline flex items-center gap-2"><Key className="h-5 w-5" /> Research Credentials</CardTitle>
                          <CardDescription>Configure your personal API keys to ensure consistent scholarly access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-4">
                             <div className="flex justify-between items-center">
                               <Label>Personal Gemini API Key</Label>
                               <Button variant="link" className="p-0 h-auto text-xs" asChild>
                                 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get Key <Link2 className="h-3 w-3 ml-1" /></a>
                               </Button>
                             </div>
                             <Input 
                               type="password" 
                               placeholder="Enter your private Google AI key"
                               value={aiPrefs.customApiKey}
                               onChange={e => saveAiPreferences({ customApiKey: e.target.value })}
                             />
                             <p className="text-[10px] text-muted-foreground italic">
                               Supplying your own key prevents shared system limits from affecting your research.
                             </p>
                           </div>

                          <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                              <Label>AI Provider</Label>
                              <Select 
                                value={aiPrefs.modelProvider} 
                                onValueChange={(val: any) => saveAiPreferences({ modelProvider: val, selectedModel: val === 'google' ? 'googleai/gemini-2.5-flash' : localModels[0] })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="google">Google Gemini (Cloud)</SelectItem>
                                  <SelectItem value="local">Ollama (Local)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Active Model</Label>
                              <Select 
                                value={aiPrefs.selectedModel} 
                                onValueChange={(val) => saveAiPreferences({ selectedModel: val })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {aiPrefs.modelProvider === 'google' ? (
                                    <>
                                      <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                      <SelectItem value="googleai/gemini-2.5-pro-001">Gemini 2.5 Pro</SelectItem>
                                    </>
                                  ) : (
                                    localModels.map(m => (
                                      <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
