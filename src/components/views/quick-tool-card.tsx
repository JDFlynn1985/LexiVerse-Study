'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface QuickToolCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick?: () => void;
  asLink?: string;
}

export function QuickToolCard({ title, desc, icon, onClick, asLink }: QuickToolCardProps) {
  const content = (
    <div className="flex flex-col">
      <div className="mb-4 p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors inline-block w-fit">
        {icon}
      </div>
      <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );

  if (asLink) {
    return (
      <Link href={asLink} className="p-6 cursor-pointer border rounded-lg transition-all hover:shadow-lg hover:border-primary/30 group bg-card/50">
        {content}
      </Link>
    );
  }

  return (
    <Card 
      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 group bg-card/50"
      onClick={onClick}
    >
      {content}
    </Card>
  );
}
