import React from 'react';
import { Crown, Cpu, Palette, TrendingUp } from 'lucide-react';
import ayanPhoto from '../assets/images/ayan_cartoon_avatar_1786808029377.jpg';
import shahrozPhoto from '../assets/images/shahroz_cartoon_avatar_1786808061236.jpg';
import shahzaibPhoto from '../assets/images/shahzaib_cartoon_avatar_1786808044761.jpg';
import jahanzaibPhoto from '../assets/images/jahanzaib_cartoon_avatar_1786808079776.jpg';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  titleBadge: string;
  icon: React.ElementType;
  photoUrl?: string;
  hasPhoto: boolean;
  accentColor: string;
  badgeBg: string;
  bio: string;
  responsibilities: string[];
  tags: string[];
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'ayan',
    name: 'Ayan Ahmed',
    role: 'Founder and CEO',
    titleBadge: 'Leadership & Product Vision',
    icon: Crown,
    photoUrl: ayanPhoto,
    hasPhoto: true,
    accentColor: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    bio: 'Leading the vision, engineering roadmap, and mission of AI Study Buddy to democratize world-class, zero-hallucination homework assistance and academic tools for students worldwide.',
    responsibilities: [
      'Product Architecture & Core Roadmap',
      'Global Educational Strategy',
      'Platform Reliability & AI Safety'
    ],
    tags: ['Product Vision', 'AI Innovation', 'Executive Leadership', 'EdTech']
  },
  {
    id: 'shahzaib',
    name: 'Shahzaib Ahmed',
    role: 'AI Engineer',
    titleBadge: 'Neural Indexing & Core AI',
    icon: Cpu,
    photoUrl: shahzaibPhoto,
    hasPhoto: true,
    accentColor: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    bio: 'Designing the high-precision retrieval-augmented generation (RAG) pipelines, citation grounding algorithms, and real-time audio voice teacher models.',
    responsibilities: [
      'Multi-Document RAG & Grounded Search',
      'SM-2 Spaced Repetition Algorithms',
      'Real-Time Gemini Voice Optimization'
    ],
    tags: ['AI Engineering', 'RAG & Grounding', 'Machine Learning', 'Low-Latency Audio']
  },
  {
    id: 'shahroz',
    name: 'Shahroz Ahmed',
    role: 'UI/UX Designer',
    titleBadge: 'Design Systems & Experience',
    icon: Palette,
    photoUrl: shahrozPhoto,
    hasPhoto: true,
    accentColor: 'from-purple-600 to-pink-600',
    badgeBg: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    bio: 'Creating intuitive, distraction-free study interfaces, interactive 3D flashcard experiences, and responsive multi-device workflows for learners of all ages.',
    responsibilities: [
      'Accessible & Fluid User Interfaces',
      '3D Interactive Components & Animations',
      'Visual Identity & Usability Testing'
    ],
    tags: ['UI/UX Design', 'Design Systems', '3D Graphics', 'User Research']
  },
  {
    id: 'jahanzaib',
    name: 'Jahanzaib Ahmed',
    role: 'CMO (Chief Marketing Officer)',
    titleBadge: 'Growth & Global Partnerships',
    icon: TrendingUp,
    photoUrl: jahanzaibPhoto,
    hasPhoto: true,
    accentColor: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    bio: 'Spearheading global student acquisition, university campus partnerships, and scholarship data integrations to bring AI Study Buddy to millions.',
    responsibilities: [
      'International Growth & Student Outreach',
      'University & Campus Partnerships',
      'Community & Academic Advocacy'
    ],
    tags: ['Growth Marketing', 'Brand Strategy', 'Campus Outreach', 'Global Partnerships']
  }
];
