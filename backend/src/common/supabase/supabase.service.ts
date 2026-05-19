import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verify Supabase access token (JWT string from Authorization header)
   */
  async verifyAccessToken(accessToken: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(accessToken);
      if (error) throw error;
      return data.user;
    } catch {
      return null;
    }
  }

  /** Load auth user by Supabase UUID (service role) */
  async getAuthUserById(userId: string) {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);
      if (error) throw error;
      return data.user;
    } catch {
      return null;
    }
  }

  /**
   * Get authenticated user from token
   */
  async getUserFromToken(token: string) {
    return this.verifyAccessToken(token);
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer | string,
    contentType?: string,
  ) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType || 'application/octet-stream',
          upsert: false,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string) {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
}
