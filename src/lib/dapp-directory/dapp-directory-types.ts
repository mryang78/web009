// ---------------------------------------------------------------------------
// DApp Directory Engine —— 类型定义
//
// @/lib/shared/entities.mockDApps 是"DApp 样本库"的静态基线数据（全站唯一
// 目录），但它是一个 const 数组，没有任何地方可以真实地"修改"它。这个模块
// 补上那一层：一个以 mockDApps 为初始值、真正可写的内存 Map + 发布订阅，
// 让 /admin/dapps 的编辑操作能落地为一次真实状态变化，并被 /soc/dashboard
// 等读取同一份目录的页面实时看到——这正是"后台修改分析数据后，SOC 页面
// 能够反映变化"这句话在代码里的落地点。
//
// 纯分析安全研究平台：这里的"状态/风险等级"只是展示用的分类标签，不触发、
// 也不代表任何真实的链上操作或第三方风控动作。
// ---------------------------------------------------------------------------

import type { RiskLevel } from "@/lib/shared/types";

export type DAppDirectoryStatus = "Active" | "Disabled";

export interface DAppDirectoryEntry {
  id: string;
  name: string;
  domain: string;
  category: string;
  riskLevel: RiskLevel;
  contractAddress: string;
  status: DAppDirectoryStatus;
  /** 最近一次被后台编辑的时间；从未编辑过则为 undefined（仍是初始静态基线值）。 */
  updatedAt?: string;
}

export type DAppDirectoryListener = () => void;
export type Unsubscribe = () => void;
