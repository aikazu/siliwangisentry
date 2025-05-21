import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '@opensearch-project/opensearch';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AssetsModule } from './assets/assets.module';
import { ScansModule } from './scans/scans.module';
import { FindingsModule } from './findings/findings.module';
import { ToolRunsModule } from './tool-runs/tool-runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env', // Optional: if you use a .env file for local dev; docker-compose envs are primary
      ignoreEnvFile: process.env.NODE_ENV === 'production', // Ignore .env in production
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        // entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Path to your entities
        entities: [], // Start with empty array, will add entities later
        synchronize: process.env.NODE_ENV !== 'production', // true: auto-create schema (dev only), false: use migrations (prod)
        logging: process.env.NODE_ENV !== 'production' ? 'all' : ['error'],
        autoLoadEntities: true, // Automatically loads entities registered through forFeature()
      }),
    }),
    // Add other modules here later (e.g., WorkspacesModule, AssetsModule, etc.)
    WorkspacesModule,
    AssetsModule,
    ScansModule,
    FindingsModule,
    ToolRunsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'OPENSEARCH_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const node = configService.get<string>('OPENSEARCH_URL');
        if (!node) {
          throw new Error('OPENSEARCH_URL is not configured');
        }
        // Add authentication here if your OpenSearch cluster has security enabled
        // const client = new Client({ 
        //   node: node,
        //   auth: {
        //     username: configService.get<string>('OPENSEARCH_USER',''), // provide defaults or ensure they exist
        //     password: configService.get<string>('OPENSEARCH_PASS','')
        //   },
        //   ssl: {
        //      // ca: fs.readFileSync('path/to/ca.pem'), // if using self-signed certs
        //      rejectUnauthorized: process.env.NODE_ENV === 'production' // false for dev with self-signed certs
        //   }
        // });
        return new Client({ node }); // Basic client for now
      },
    },
  ],
})
export class AppModule {} 