import { History, PanelLeft, Workflow } from "lucide-react";

export default function WorkflowPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-4 text-foreground sm:px-6">
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-foreground">
            <PanelLeft className="h-4 w-4" />
            Sidebar
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-foreground">
            <Workflow className="h-4 w-4" />
            Canvas
          </div>
          <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-dashed border-border bg-background/40 text-sm text-muted-foreground">
            Workflow canvas placeholder
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-foreground">
            <History className="h-4 w-4" />
            History
          </div>
        </aside>
      </div>
    </main>
  );
}
