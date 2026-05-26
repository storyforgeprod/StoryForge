import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
};

type GoogleAuthUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateFromSupabase(supabaseUser: SupabaseAuthUser): Promise<User> {
    const email = supabaseUser.email;
    if (!email) {
      throw new Error('Supabase user missing email');
    }

    const name =
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      null;
    const avatar = supabaseUser.user_metadata?.avatar_url ?? null;

    return this.prisma.user.upsert({
      where: { email },
      create: {
        supabaseId: supabaseUser.id,
        email,
        name,
        avatar,
        provider: 'supabase',
        role: UserRole.USER,
      },
      update: {
        email,
        name: name ?? undefined,
        avatar: avatar ?? undefined,
        supabaseId: supabaseUser.id,
        provider: 'supabase',
      },
    });
  }

  async findOrCreateFromGoogle(googleUser: GoogleAuthUser): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: googleUser.email },
      create: {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name ?? null,
        avatar: googleUser.picture ?? null,
        provider: 'google',
        role: UserRole.USER,
      },
      update: {
        googleId: googleUser.id,
        name: googleUser.name ?? undefined,
        avatar: googleUser.picture ?? undefined,
        provider: 'google',
      },
    });
  }

  async findBySupabaseId(supabaseId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async createWithPassword(email: string, passwordHash: string, name?: string): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email,
        name: name ?? null,
        provider: 'local',
        role: UserRole.USER,
      },
    });

    await this.prisma.userPassword.create({
      data: {
        userId: user.id,
        passwordHash,
      },
    });

    return user;
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    const record = await this.prisma.userPassword.findUnique({
      where: { userId },
    });
    return record?.passwordHash ?? null;
  }
}
