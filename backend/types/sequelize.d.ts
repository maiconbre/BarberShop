// Type definitions for Sequelize models
import { Sequelize, Model, DataTypes, ModelStatic } from 'sequelize';

declare module 'sequelize' {
  interface Sequelize {
    authenticate(): Promise<void>;
    sync(options?: any): Promise<void>;
    define(modelName: string, attributes: any, options?: any): ModelStatic<Model>;
    query(sql: string, options?: any): Promise<any>;
  }
}

export interface UserAttributes {
  id: string;
  username: string;
  password: string;
  role: string;
  name: string;
  barbershopId: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BarbershopAttributes {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  plan_type: 'free' | 'pro';
  settings: object;
  created_at?: Date;
  updated_at?: Date;
}

export interface ServiceAttributes {
  id: string;
  name: string;
  price: number;
  barbershopId: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BarberAttributes {
  id: string;
  name: string;
  whatsapp: string;
  pix: string;
  barbershopId: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AppointmentAttributes {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  barberId: string;
  barberName: string;
  price: number;
  wppclient: string;
  barbershopId: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CommentAttributes {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  barbershopId: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BarberServicesAttributes {
  BarberId: string;
  ServiceId: string;
  barbershopId: string;
  created_at?: Date;
  updated_at?: Date;
}