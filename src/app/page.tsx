
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, useDoc } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
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
  Milestone,
  Settings,
  LogOut,
  Library,
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  GraduationCap,
  Highlighter,
  Newspaper,
  PenTool,
  ShieldCheck,
  ArrowLeftRight,
  User as UserIcon,
  Save,
  Award,
  AlertTriangle,
  Key,
  Lock,
  WifiOff,
  Map as MapIcon,
  Scale,
  Cpu,
  History,
  Code
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';

type ViewMode = 'dashboard' | 'lexicon' | 'wiki' | 'blog' | 'theology-map' | 'timeline' | 'writing-assistant' | 'academic-integrity' | 'ai-assistant' | 'verse-explorer' | 'compare-translations' | 'research-library' | 'profile' | 'api-mgmt';

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
    storagePreference?: 'cloud' | 'local';
  };
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
  
  // System Config State
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [localDocuments, setLocalDocuments] = useState<IDBDocument[]>([]);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);
  const [localApiKey, setLocalApiKey] = useState<string>('');
  
  // Derived Preferences
  const [aiPrefs, setAiPrefs] = useState({
    modelProvider: 'google',
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: '',
    preferredBibleVersion: 'kjv',
    language: language,
    storagePreference: 'local' as 'cloud' | 'local'
  });

  const [assistantTerm, setAssistantTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);
  const [profileDraft, setProfileDraft] = useState({ displayName: '', credentials: '', bio: '', photoURL: '' });

  const refreshLocalDocs = useCallback(async () => {
    const docs = await getAllLocalDocuments();
    setLocalDocuments(docs);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedLocalKey = localStorage.getItem('lexiverse_local_api_key');
    if (savedLocalKey) setLocalApiKey(savedLocalKey);

    refreshLocalDocs();
    getVersions().then(setAvailableVersions);

    // Fetch Global System Config
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSystemConfig(data);
        // Default UI state if user hasn't set anything
        if (!userProfile?.preferences) {
          setAiPrefs(prev => ({
            ...prev,
            modelProvider: data.defaultModelProvider || 'google',
            selectedModel: data.defaultModel || 'googleai/gemini-2.5-flash'
          }));
        }
      }
    });
    return () => unsubConfig();
  }, [db, refreshLocalDocs, userProfile?.preferences]);

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
            setAiPrefs(prev => ({
              ...prev,
              ...data.preferences,
              language: data.preferences?.language || language
            }));
          }
        }
      });
      return () => unsub();
    }
  }, [user, db, language]);

  // CALCULATION OF EFFECTIVE AI STATE
  const effectiveApiKey = localApiKey || aiPrefs.customApiKey || systemConfig?.geminiApiKey;
  const isLocalMode = aiPrefs.modelProvider === 'local';
  const effectiveModel = isLocalMode 
    ? `ollama/${aiPrefs.selectedModel}` 
    : (aiPrefs.selectedModel.includes('/') ? aiPrefs.selectedModel : `googleai/${aiPrefs.selectedModel}`);

  const handleSearch = async (term: string, type: ViewMode) => {
    if (!term.trim()) return;
    if (!effectiveApiKey && !isLocalMode && ['lexicon', 'ai-assistant', 'verse-explorer', 'compare-translations', 'writing-assistant', 'academic-integrity', 'theology-map', 'timeline'].includes(type)) {
      toast({ variant: "destructive", title: "AI Hub Configuration Required", description: "Please supply your own Gemini API key or switch to a local engine in settings." });
      return;
    }
    setIsLoading(true);
    setActiveTab(type);
    logSearch(db, term, type, user?.uid);
    try {
      if (type === 'lexicon') {
        const result = await defineAndAnalyzeTerm({ strongsNumber: term, model: effectiveModel, apiKey: effectiveApiKey || undefined });
        setLexiconResult(result);
      } else if (type === 'ai-assistant') {
        const researchContext = localDocuments.map(d => d.content);
        const result = await aiStudyAssistant({ term, researchContext, model: effectiveModel, apiKey: effectiveApiKey || undefined });
        setAssistantResult(result);
      }
      const newHistory = [{id: Date.now().toString(), type, term, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory.slice(0, 10)));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Research Engine Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profileDraft.displayName,
        credentials: profileDraft.credentials,
        bio: profileDraft.bio,
        photoURL: profileDraft.photoURL
      });
      toast({ title: "Profile Updated", description: "Identity updated successfully." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAiPreferences = async (newPrefs: any) => {
    if (!user || !db) return;
    try {
      const storageMode = newPrefs.storagePreference || aiPrefs.storagePreference;
      if (storageMode === 'local') {
        if (newPrefs.customApiKey !== undefined) {
          localStorage.setItem('lexiverse_local_api_key', newPrefs.customApiKey);
          setLocalApiKey(newPrefs.customApiKey);
          newPrefs.customApiKey = ""; 
        }
      } else if (storageMode === 'cloud') {
        localStorage.removeItem('lexiverse_local_api_key');
        setLocalApiKey('');
      }
      await updateDoc(doc(db, 'users', user.uid), { preferences: { ...userProfile?.preferences, ...newPrefs } });
      setAiPrefs(prev => ({...prev, ...newPrefs}));
      toast({ title: "Preferences Saved", description: "Scholarly configuration refreshed." });
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
          uid: result.user.uid, displayName: result.user.displayName, email: result.user.email, photoURL: '',
          isAdmin: false, isModerator: false, isTrustedContributor: false,
          preferences: {
            modelProvider: systemConfig?.defaultModelProvider || 'google',
            selectedModel: systemConfig?.defaultModel || 'googleai/gemini-2.5-flash',
            customApiKey: '', storagePreference: 'local' 
          }
        });
      }
      toast({ title: "Scholarly Access Granted", description: `Welcome, ${result.user.displayName}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  if (!mounted) return null;
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
                <SidebarMenuItem><SidebarMenuButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Dashboard"><LayoutDashboard className="h-5 w-5" /> <span>Dashboard</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton isActive={activeTab === 'wiki'} onClick={() => setActiveTab('wiki')} tooltip="Scholarly Wiki"><GraduationCap className="h-5 w-5" /> <span>Scholarly Wiki</span></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>AI Research Hub</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton isActive={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} tooltip="Study Assistant"><Sparkles className="h-5 w-5" /> <span>Study Assistant</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton isActive={activeTab === 'lexicon'} onClick={() => setActiveTab('lexicon')} tooltip="Lexicon Analysis"><BookOpen className="h-5 w-5" /> <span>Lexicon</span></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {userProfile?.isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Governance</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeTab === 'api-mgmt'} onClick={() => setActiveTab('api-mgmt')} tooltip="API Management">
                      <Code className="h-5 w-5" /> <span>API Management</span>
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
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open('/admin/settings', '_blank')}><Settings className="h-4 w-4" /></Button>
                )}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border"><Avatar className="h-full w-full"><AvatarImage src={effectiveAvatar} /><AvatarFallback><UserIcon /></AvatarFallback></Avatar></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel><div className="flex flex-col"><span>{userProfile?.displayName || user.displayName}</span><span className="text-[10px] text-muted-foreground font-normal">{userProfile?.credentials}</span></div></DropdownMenuLabel>
                      <DropdownMenuSeparator /><DropdownMenuItem onClick={() => setActiveTab('profile')}><UserIcon className="h-4 w-4 mr-2" /> My Profile</DropdownMenuItem>
                      <DropdownMenuSeparator /><DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : <Button variant="outline" size="sm" onClick={handleLogin}>Login</Button>}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main id="main-content" className="container max-w-5xl mx-auto py-10 px-6 min-h-screen">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header>
                  <h1 className="text-4xl font-bold font-headline">Research Workspace</h1>
                  <p className="text-muted-foreground text-lg">Integrated AI and local-only databases for biblical scholarship.</p>
                </header>
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="md:col-span-2 shadow-md border-primary/10">
                    <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Sparkles className={cn("h-5 w-5", effectiveApiKey || isLocalMode ? "text-primary" : "text-muted-foreground")} /> {isLocalMode ? `Local Assistant (${aiPrefs.selectedModel})` : "Cloud Assistant (Gemini)"}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input placeholder={effectiveApiKey || isLocalMode ? "Analyze eschatological fragments..." : "AI Engine Configuration Needed"} value={assistantTerm} onChange={e => setAssistantTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')} />
                        <Button onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            {activeTab === 'api-mgmt' && userProfile?.isAdmin && <APIKeyManagement />}
            {activeTab === 'profile' && userProfile && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header><h1 className="text-3xl font-bold font-headline">Scholarly Profile</h1></header>
                <div className="grid gap-8 md:grid-cols-3">
                  <Card className="md:col-span-1 shadow-lg border-primary/10 h-fit">
                    <CardHeader className="text-center pb-2">
                      <div className="relative mx-auto w-32 h-32 mb-4"><Avatar className="w-full h-full border-4 border-background shadow-xl"><AvatarImage src={effectiveAvatar} /><AvatarFallback><UserIcon className="h-12 w-12" /></AvatarFallback></Avatar></div>
                      <CardTitle className="font-headline">{userProfile.displayName}</CardTitle>
                      <CardDescription><Award className="h-3 w-3 inline text-accent mr-1" /> {userProfile.credentials || "Scholar"}</CardDescription>
                    </CardHeader>
                  </Card>
                  <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-lg border-primary/10">
                      <CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> AI Hub Preferences</CardTitle></CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>AI Research Engine</Label>
                            <Select value={aiPrefs.modelProvider} onValueChange={(val: any) => saveAiPreferences({ modelProvider: val, selectedModel: val === 'google' ? 'googleai/gemini-2.5-flash' : (systemConfig?.localModelList?.[0] || 'llama3') })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="google">Google Gemini (Cloud)</SelectItem><SelectItem value="local">Ollama (Local Network)</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function APIKeyManagement() {
  // Nested to keep changes simple for the agent loop
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [keys, setKeys] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      setSystemConfig(configSnap.data());
      const keysSnap = await getDocs(query(collection(db, 'api_keys'), orderBy('createdAt', 'desc')));
      setKeys(keysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      if (configSnap.data()?.apiTiers?.length > 0) setSelectedTier(configSnap.data().apiTiers[0].name);
      setLoading(false);
    }
    load();
  }, [db]);

  const generate = async () => {
    const key = `lv_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyData = { key, label: newKeyLabel, tier: selectedTier || 'Default', ownerUid: user?.uid, createdAt: new Date().toISOString(), usageCount: 0, revoked: false };
    await setDoc(doc(db, 'api_keys', crypto.randomUUID()), keyData);
    setKeys([keyData, ...keys]);
    setNewKeyLabel('');
    toast({ title: "API Key Created", description: "Integration token is now active." });
  };

  const revoke = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'api_keys', id), { revoked: !current });
    setKeys(keys.map(k => k.id === id ? { ...k, revoked: !current } : k));
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Initializing Governance...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3"><Key className="text-primary h-8 w-8" /> API Management</h1>
        <p className="text-muted-foreground">Provision and govern external scholarly access.</p>
      </header>
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-md border-primary/10">
          <CardHeader><CardTitle className="text-lg">Provision New Key</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Key Label</Label><Input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="e.g. Logos Integration" /></div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {systemConfig?.apiTiers?.map((t: any) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                  <SelectItem value="Default">Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter><Button className="w-full" onClick={generate} disabled={!newKeyLabel}><Plus className="mr-2 h-4 w-4" /> Generate Token</Button></CardFooter>
        </Card>
        <Card className="md:col-span-2 shadow-lg border-primary/10">
          <CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>Tier</TableHead><TableHead>Usage</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {keys.map(k => (
                  <TableRow key={k.id} className={k.revoked ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{k.label}</TableCell>
                    <TableCell><Badge variant="secondary">{k.tier}</Badge></TableCell>
                    <TableCell className="text-xs">{k.usageCount} calls</TableCell>
                    <TableCell>{k.revoked ? <Badge variant="destructive">REVOKED</Badge> : <Badge variant="outline" className="text-green-600">ACTIVE</Badge>}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => revoke(k.id, k.revoked)}>{k.revoked ? "Enable" : "Disable"}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
