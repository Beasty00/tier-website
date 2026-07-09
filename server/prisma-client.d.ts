declare module "@prisma/client" {
  export class PrismaClient {
    [key: string]: any;
    constructor(...args: any[]);
    $queryRaw(strings: TemplateStringsArray, ...values: any[]): Promise<any>;
    $disconnect(): Promise<void>;
  }
}
