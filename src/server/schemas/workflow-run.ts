import { z } from "zod";

export const workflowRunTargetSchema = z.enum(["single", "selected", "full"]);

export const workflowRunInputSchema = z.object({
  workflowId: z.string().min(1),
  nodeIds: z.array(z.string().min(1)).default([]),
  target: workflowRunTargetSchema,
});

export type WorkflowRunInput = z.infer<typeof workflowRunInputSchema>;
