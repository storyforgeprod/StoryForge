import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Soft reset (for testing)
   * Deletes all data but keeps schema
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase only available in test environment');
    }

    const models = ['Event', 'Output', 'Job', 'Project', 'User'];
    for (const model of models) {
      await (this as any)[model].deleteMany();
    }
  }
}
