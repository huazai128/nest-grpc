import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

type GrpcSvc = Record<string, (req: Record<string, unknown>) => ReturnType<any>>;

@Injectable()
export class MonitorGrpcService implements OnModuleInit {
  private pv: GrpcSvc;
  private pref: GrpcSvc;
  private apiLog: GrpcSvc;
  private eventLog: GrpcSvc;
  private customLog: GrpcSvc;
  private userLog: GrpcSvc;
  private error: GrpcSvc;

  constructor(@Inject('MONITOR_GRPC') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.pv = this.client.getService<GrpcSvc>('PvService');
    this.pref = this.client.getService<GrpcSvc>('PrefService');
    this.apiLog = this.client.getService<GrpcSvc>('ApiLogService');
    this.eventLog = this.client.getService<GrpcSvc>('EventLogService');
    this.customLog = this.client.getService<GrpcSvc>('CustomLogService');
    this.userLog = this.client.getService<GrpcSvc>('UserLogService');
    this.error = this.client.getService<GrpcSvc>('ErrorService');
  }

  private call(svc: GrpcSvc, method: string, query: Record<string, unknown>) {
    if (!svc?.[method]) {
      throw new Error(`gRPC 方法不存在: ${method}`);
    }
    return lastValueFrom(svc[method](query));
  }

  pvMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.pv, method, query);
  }

  prefMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.pref, method, query);
  }

  apiMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.apiLog, method, query);
  }

  eventMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.eventLog, method, query);
  }

  customMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.customLog, method, query);
  }

  userLogMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.userLog, method, query);
  }

  errorMethod(method: string, query: Record<string, unknown>) {
    return this.call(this.error, method, query);
  }
}
