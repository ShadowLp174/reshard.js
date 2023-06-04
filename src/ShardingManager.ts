import { ClientOptions, Client } from "./Client";
import { DataLogin } from "revolt-api";
import EventEmitter from "events";
import { Shard } from "./Shard";

export type ShardingManagerOptions = {
  shardServerCount?: number;
  scriptPath: string;
}

export class ShardingManager extends EventEmitter {
  clientOptions: ClientOptions;
  masterClient: Client;
  loginInfo: DataLogin | string | null = null;

  options: ShardingManagerOptions;

  shardCount = 0;
  shards: Array<Shard> = [];

  currId = 1;

  constructor(managerOptions: ShardingManagerOptions, options: ClientOptions) {
    super();

    this.clientOptions = options;
    this.masterClient = new Client(options);

    this.options = {
      ...managerOptions,
      shardServerCount: 10
    }

    this.masterClient.once("ready", () => {
      const shardServerCount = this.options.shardServerCount ?? 10;
      this.shardCount = Math.ceil(this.masterClient.servers.size() / shardServerCount);

      var servers = this.masterClient.servers.map(s => s.id);
      for (let i = 0; servers.length !== 0; i += shardServerCount) {
        this.shards.push(this.spawnShard(servers.splice(i, shardServerCount)));
      }
    });
  }
  spawnShard(servers: Array<string>): Shard { // TODO: spawn in worker process
    return new Shard(this.clientOptions, {
      servers: servers,
      script: this.options.scriptPath,
      manager: this,
      id: this.currId++,
      loginData: this.loginInfo ?? ""
    });
  }

  broadcastEval(data: Function): any {
    return new Promise(res => {
      const promises = this.shards.map(shard => {
        return data.call(shard, shard)
      });
      Promise.all(promises).then(res);
    });
  }

  login(details: DataLogin) {
    this.loginInfo = details;
    return this.masterClient.login(details);
  }
  loginBot(token: string) {
    this.loginInfo = token;
    return this.masterClient.loginBot(token);
  }
}
