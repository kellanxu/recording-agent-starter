export interface SkillAnswers {
  source: string;
  categories: readonly string[];
  retentionRule: string;
}

function list(values: readonly string[]): string {
  return values.map((value) => `- ${value}`).join('\n');
}

export function renderRecordingSkill(answers: SkillAnswers): string {
  return `---
name: personal-recording-processor
description: 将本人的录音逐字稿整理为可审计、可确认的 Markdown 主记录。
---

# Personal Recording Processor

## 来源

${answers.source}

## 分类体系

${list(answers.categories)}

## 入库位置

主记录写入机器配置指定的本地 Markdown 库。不要在本 Skill 中记录绝对路径、Bridge profile、
chat ID、凭证或运行状态。

## 沉淀规则

${answers.retentionRule}

## 输出边界

- 一条录音只维护一个主记录。
- 原始证据、AI 整理、候选待办和人工意见必须分开。
- 缺少对象、动作、时间或验收标准时写“未明确”，不得补造事实。
- 不自动创建任务、发布内容或删除原始材料。
- 修改与分类变更必须保留审计。
`;
}
