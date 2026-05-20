import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
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
      where: { supabaseId: supabaseUser.id },
      create: {
        supabaseId: supabaseUser.id,
        email,
        name,
        avatar,
      },
      update: {
        email,
        name: name ?? undefined,
        avatar: avatar ?? undefined,
      },
    });
  }

  async findBySupabaseId(supabaseId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }
}
