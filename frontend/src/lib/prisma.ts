import { PrismaClient } from '@prisma/client';

const mockPrisma = new Proxy({}, {
  get(target, prop) {
    if (prop === '$connect' || prop === '$disconnect') return async () => {};
    return new Proxy({}, {
      get(model, method) {
        return async (args: any) => {
          console.log(`[MOCK PRISMA] ${String(prop)}.${String(method)}`);
          if (method === 'findMany') return [];
          if (method === 'findFirst' || method === 'findUnique') {
             return { id: 'mock', email: 'mock@mock.com', walletAddress: args?.where?.walletAddress || '0x0', contractAddress: args?.where?.contractAddress || '0x0' };
          }
          return { id: 'mock-id' };
        };
      }
    });
  }
});

export const prisma = mockPrisma as unknown as PrismaClient;
