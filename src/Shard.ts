import { ClientOptions, Client } from "./Client";
import { EventEmitter } from "events";
import { ShardingManager } from "./ShardingManager";
import { DataLogin } from "revolt-api";

export type ShardOptions = {
  servers: Array<string>;
  script: string;
  manager: ShardingManager;
  id: number;
  loginData: DataLogin | string;
}

export class Shard extends EventEmitter {
  script: string;
  client: Client;
  mgr: ShardingManager;
  id: number;

  constructor(options: ClientOptions, settings: ShardOptions) {
    super();

    this.client = new Client({ ...options, instanceServers: settings.servers });
    this.mgr = settings.manager;
    this.id = settings.id;
 
    this.script = settings.script;

    this.client.once("ready", () => { // TODO: use worker scripts
      require(require("path").resolve(this.script)).call(this, this);
    });

    if (typeof settings.loginData === "string") {
      this.client.loginBot(settings.loginData);
    } else {
      this.client.login(settings.loginData);
    }
  }
  broadcastEval(data: Function): any {
    return this.mgr.broadcastEval(data);
  }
}
