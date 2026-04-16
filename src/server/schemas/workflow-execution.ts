import { z } from "zod";

import { workflowGraphSchema } from "@/server/schemas/workflow";
import { workflowRunTargetSchema } from "@/server/schemas/workflow-run";

export const workflowExecutionInputSchema = z.object({
  workflowId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(300).nullable(),
  target: workflowRunTargetSchema,
  nodeIds: z.array(z.string().min(1)).default([]),
  graph: workflowGraphSchema,
});

export type WorkflowExecutionInput = z.infer<typeof workflowExecutionInputSchema>;
