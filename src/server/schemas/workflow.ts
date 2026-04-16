import { z } from "zod";

export const workflowViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export const workflowGraphSchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
  viewport: workflowViewportSchema,
});

export const workflowInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(300).nullable(),
  graph: workflowGraphSchema,
});

export type WorkflowInput = z.infer<typeof workflowInputSchema>;
