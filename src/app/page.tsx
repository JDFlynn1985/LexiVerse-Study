'use client';

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarRail, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Search, BookOpen, Scroll, Feather, FileText, Info, Settings, Mic } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2">
            <SidebarInput placeholder="Search scriptures..." />
            <SidebarMenuButton
              variant="outline"
              size="lg"
              tooltip="LexiVerse Explorer" 
              className="text-headline font-bold text-lg h-12 w-full justify-center"
            >
              <Search className="mr-2 h-5 w-5" />
              LexiVerse Explorer
            </SidebarMenuButton>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Explore</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={true}
                      tooltip="Word Studies"
                      className="text-headline"
                    >
                      <BookOpen className="mr-2 h-5 w-5"/> 
                      Word Studies
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Verse Explorer">
                      <Scroll className="mr-2 h-5 w-5"/> 
                      Verse Explorer
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Commentaries">
                      <Feather className="mr-2 h-5 w-5"/> 
                      Commentaries
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Translations">
                      <FileText className="mr-2 h-5 w-5"/> 
                      Translations
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sword Modules">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-puzzle mr-2 h-5 w-5"><path d="M11 19c-1.5-1-3-2-4-3s-2-2-3-3"></path><path d="M15 19c1.5-1 3-2 4-3s2-2 3-3"></path><path d="M11 5c-1.5 1-3 2-4 3s-2 2-3 3"></path><path d="M15 5c1.5 1 3 2 4 3s2 2 3 3"></path><path d="M2 12h4"></path><path d="M18 2h4"></path><path d="M2 18h4"></path><path d="M18 22h4"></path><path d="M12 11v4"></path><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M22 12h-4"></path></svg>
                      Sword Modules
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="AI Assistant">
                       <Mic className="mr-2 h-5 w-5"/> 
                      AI Assistant
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings">
                      <Settings className="mr-2 h-5 w-5"/> 
                      Settings
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="About">
                      <Info className="mr-2 h-5 w-5"/> 
                      About
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter>
             <SidebarMenuButton variant="outline" tooltip="Export Current Study" className="w-full">
               Export Current Study
             </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        <SidebarRail />

        <SidebarInset className="p-4">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-6xl font-bold font-headline text-primary">LexiVerse Explorer</h1>
            <p className="text-xl text-muted-foreground mt-4">Your gateway to in-depth biblical exploration.</p>
            <p className="mt-8 text-lg">
              Start your journey by searching for a scripture term or verse in the sidebar.
            </p>
            <Button className="mt-8 px-8 py-3 text-lg">Get Started</Button>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
