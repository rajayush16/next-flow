import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireUser } from "@/lib/clerk";

export default async function WorkflowPage() {
  await requireUser();

  return <WorkspaceShell />;
}
