import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

type GoogleUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<{ access_token: string; user: User }> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // For now, store password hash in a separate table (future implementation)
    // This is a simplified approach; in production, use a dedicated auth provider
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with local auth provider
    const user = await this.usersService.createWithPassword(
      email,
      hashedPassword,
      name,
    );

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token, user };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: User }> {
    const user = await this.usersService.findByEmail(email) as any;

    if (!user || !user.userPassword?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.userPassword.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token, user };
  }

  async googleAuth(googleUser: GoogleUser): Promise<{ access_token: string; user: User }> {
    const user = await this.usersService.findOrCreateFromGoogle(googleUser);

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token, user };
  }

  async refreshToken(token: string): Promise<{ access_token: string }> {
    try {
      const decoded = this.jwtService.verify(token, {
        ignoreExpiration: true, // Allow expired tokens to be refreshed
      });

      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const access_token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
