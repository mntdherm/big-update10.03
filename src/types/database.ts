// If needed, update the database types to include new operations system entities

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'vendor' | 'customer';
  banned?: boolean;
  verified?: boolean;
  createdAt: any;
  updatedAt?: any;
  profileImage?: string;
  wallet?: {
    coins: number;
    transactions?: Transaction[];
  };
  referralCode?: string;
  referralCount?: number;
  usedReferralCode?: string;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessId: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phoneNumber: string;
  email?: string;
  website?: string;
  logoImage?: string;
  coverImage?: string;
  description?: string;
  rating?: number;
  ratingCount?: number;
  reviews?: Review[];
  categories: string[];
  keywords?: string[];
  verified?: boolean;
  banned?: boolean;
  featured?: boolean;
  createdAt: any;
  updatedAt?: any;
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Service {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image?: string;
  category: string;
  featured?: boolean;
  available: boolean;
  coinReward?: number; // Coins rewarded when appointment is completed
  createdAt: any;
  updatedAt?: any;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: any;
  serviceId?: string;
  appointmentId?: string;
}

export interface Appointment {
  id: string;
  vendorId: string;
  vendorName: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    licensePlate?: string;
  };
  date: any;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'cancelled_by_customer';
  price: number;
  totalPrice: number;
  duration: number;
  paid: boolean;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
  cancelReason?: string;
  feedback?: {
    rating: number;
    comment: string;
    createdAt: any;
  };
  coinsUsed?: number;
  // New secure coin reward fields
  coinRewardProcessed?: boolean;
  coinRewardAmount?: number;
  coinRewardTimestamp?: any;
}

export interface Review {
  id: string;
  vendorId: string;
  customerId: string;
  customerName: string;
  appointmentId?: string;
  rating: number;
  comment: string;
  createdAt: any;
  updatedAt?: any;
  reply?: {
    text: string;
    date: any;
  };
  visible: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  createdAt: any;
  updatedAt?: any;
  vendorCount?: number;
}

export interface ServiceCategory {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  order?: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  discount: number;
  discountType: 'percentage' | 'fixed';
  image?: string;
  vendorId?: string;
  serviceIds?: string[];
  code?: string;
  usageLimit?: number;
  usageCount?: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Offer {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  image?: string;
  price?: number;
  originalPrice?: number;
  serviceId?: string;
  active?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userRole: 'admin' | 'vendor' | 'customer';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: any;
  updatedAt?: any;
  assignedTo?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  responses?: {
    id: string;
    userId: string;
    userRole: string;
    message: string;
    createdAt: any;
  }[];
  attachments?: string[];
}

// Operations system entities
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'vendor' | 'customer' | 'appointment' | 'support' | 'system';
  dueDate: any;
  createdAt: any;
  updatedAt: any;
  relatedId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  timestamp: any;
  entity: 'user' | 'vendor' | 'appointment' | 'service' | 'payment' | 'system' | 'support';
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'user' | 'vendor' | 'support' | 'payment' | 'system' | 'alert';
  read: boolean;
  createdAt: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  link?: string;
  relatedId?: string;
}

export interface SystemHealthStatus {
  id: string;
  component: string;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  message?: string;
  lastChecked: any;
  responseTime?: number;
  metrics?: {
    [key: string]: number | string;
  };
}
