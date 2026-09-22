// 统一分析数据层的入口 barrel —— 新代码优先从这里导入。
// 历史遗留文件（lib/soc/*、lib/admin/*、lib/security-data.ts 等）通过
// re-export 的方式继续对外暴露旧的导入路径，避免大范围改动现有组件。

export * from "./types";
export * from "./risk";
export * from "./prng";
export * from "./entities";
export * from "./simulation";
export * from "./lookup";
