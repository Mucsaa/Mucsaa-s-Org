import React from 'react';
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Home,
  ShoppingCart,
  Dumbbell,
  User,
  Bookmark,
} from 'lucide-react';
import { TaskCategory } from '../types';

interface CategoryIconProps {
  category: TaskCategory;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  className = 'w-4 h-4',
  size,
}) => {
  switch (category) {
    case 'work':
      return <Briefcase className={className} size={size} />;
    case 'study':
      return <GraduationCap className={className} size={size} />;
    case 'health':
      return <HeartPulse className={className} size={size} />;
    case 'home':
      return <Home className={className} size={size} />;
    case 'shopping':
      return <ShoppingCart className={className} size={size} />;
    case 'exercise':
      return <Dumbbell className={className} size={size} />;
    case 'personal':
      return <User className={className} size={size} />;
    case 'other':
    default:
      return <Bookmark className={className} size={size} />;
  }
};
