import { WorkspaceClient } from "@/components/layout/workspace-client";
import { requireUser } from "@/lib/clerk";
import {
  getOrCreateSampleWorkflowAction,
  getWorkflowAction,
  listWorkflowsAction,
} from "@/server/actions/workflow";
import { listWorkflowRunsAction } from "@/server/actions/workflow-run";

type WorkflowPageProps = {
  searchParams?: Promise<{
    workflowId?: string;
  }>;
};

export default async function WorkflowPage({ searchParams }: WorkflowPageProps) {
  await requireUser();

  const params = (await searchParams) ?? {};
  const workflows = await listWorkflowsAction();
  const fallbackWorkflow = await getOrCreateSampleWorkflowAction();
  const requestedWorkflow = params.workflowId
    ? await getWorkflowAction(params.workflowId)
    : null;
  const activeWorkflow =
    requestedWorkflow ?? fallbackWorkflow;
  const runs = await listWorkflowRunsAction(activeWorkflow.id);
  const workflowSummaries = workflows.some(
    (workflow) => workflow.id === activeWorkflow.id,
  )
    ? workflows
    : [
        {
          id: activeWorkflow.id,
          name: activeWorkflow.name,
          description: activeWorkflow.description,
          createdAt: activeWorkflow.createdAt,
          updatedAt: activeWorkflow.updatedAt,
        },
        ...workflows,
      ];

  return (
    <WorkspaceClient
      bootstrap={{
        activeWorkflow,
        workflows: workflowSummaries,
        runs,
      }}
    />
  );
}
