import { ObjectId } from "mongodb";

export interface Admin {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "admin";
  isActive: boolean;
  createdBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export type AdminWithoutPassword = Omit<Admin, "passwordHash">;

export interface ContentItem {
  _id: ObjectId;
  lang: "ar" | "en";
  section: string;
  key: string;
  value: string;
  updatedBy: ObjectId;
  updatedAt: Date;
}

export interface DonateCategory {
  _id: ObjectId;
  slug: string;
  icon: string;
  ar: { label: string };
  en: { label: string };
  order: number;
  isActive: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonateCase {
  _id: ObjectId;
  number: string; // auto-padded 3-digit unique string
  categoryId: ObjectId;
  ar: { name: string; brief: string; story: string; need: string };
  en: { name: string; brief: string; story: string; need: string };
  isActive: boolean;
  isUrgent: boolean;
  order: number;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImpactStory {
  _id: ObjectId;
  imageUrl: string;
  accent: string; // hex color
  order: number;
  isActive: boolean;
  ar: { title: string; location: string; tag: string; story: string };
  en: { title: string; location: string; tag: string; story: string };
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  _id: ObjectId;
  adminId: ObjectId;
  adminName: string;
  action: "create" | "update" | "delete" | "login" | "logout";
  collection: string;
  documentId?: ObjectId;
  details: string;
  timestamp: Date;
}

export interface TokenPayload {
  sub: string; // admin _id as string
  name: string;
  email: string;
  role: "owner" | "admin";
  iat?: number;
  exp?: number;
}
