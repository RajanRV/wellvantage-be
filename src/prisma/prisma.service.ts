import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
    constructor() {
        const adapter = new PrismaPg({ url: process.env.DATABASE_URL });
        super({ adapter });
    }
    
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Cast to any to avoid overly strict event type from generated Prisma client
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
