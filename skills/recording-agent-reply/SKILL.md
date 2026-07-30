---
name: recording-agent-reply
description: Route exact Feishu Recording Agent confirmation commands delivered by lark-channel-bridge into the local Recording Agent Starter. Use when the Bridge user input is exactly `确认 R-XXXX`, `修改 R-XXXX：...`, or `分类 R-XXXX：...`, and the bridge context includes the incoming message ID.
---

# Recording Agent Reply

1. Accept only one exact confirmation command from `user_input.text`. Do not rewrite or infer it.
2. Require exactly one incoming ID in `bridge_context.messageIds`. Stop if it is absent or ambiguous.
3. Read `~/.recording-agent/bridge.json`. Require `schemaVersion: 1`, an absolute
   `workspaceRoot`, and a two-item absolute `command` argv. This machine config is separate from
   this Skill.
4. Run the configured argv with:

   ```text
   <command[0]> <command[1]> reply --workspace <workspaceRoot> --message-id <messageId> --text <exact user input>
   ```

   Pass arguments without shell interpolation.

5. Report the CLI outcome briefly. `applied` and `duplicate` are successful terminal states.
   Return `needs_clarification` exactly when the CLI reports it.

Never call Feishu APIs, create tasks, publish content, delete recordings, edit KE Nexus, or modify
the private meeting router. This Skill only invokes the deterministic local reply command.
