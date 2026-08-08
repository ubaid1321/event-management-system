import type { Metadata } from "next";

import { AddTask } from "@/app/(app)/tasks/add-task";
import { DepartmentSection } from "@/app/(app)/tasks/department-section";
import { Card, EmptyNote, PageHeader, StatTile } from "@/components/ui";
import { DEPARTMENTS } from "@/lib/domain";
import { getPrimaryEvent } from "@/lib/events";
import { formatNumber } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { getTasks, getTeam, summariseTasks } from "@/lib/tasks";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  const session = await requireSession();
  const event = await getPrimaryEvent();

  if (!event) {
    return (
      <>
        <PageHeader eyebrow="VMI Collective" title="Tasks" />
        <Card className="p-8">
          <EmptyNote>
            Tasks belong to an event, and there isn&apos;t one yet. Run
            0002_seed_wwc.sql to add World Wisdom Connect.
          </EmptyNote>
        </Card>
      </>
    );
  }

  const [tasks, team] = await Promise.all([getTasks(event.id), getTeam()]);
  const stats = summariseTasks(tasks);

  return (
    <>
      <PageHeader
        eyebrow={event.name}
        title="Tasks"
        description="Every piece of work for the event, grouped by team. Anyone can add a task; you can move and complete the ones assigned to you."
        actions={<AddTask eventId={event.id} team={team} label="New task" />}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Delivered"
          value={
            stats.percentDone === null ? "—" : `${stats.percentDone}%`
          }
          detail={
            stats.total > 0
              ? `${formatNumber(stats.done)} of ${formatNumber(stats.total)} tasks`
              : "No tasks yet."
          }
          accent
        />
        <StatTile
          label="In progress"
          value={formatNumber(stats.inProgress)}
          detail={stats.inProgress > 0 ? "Being worked on now." : "Nothing underway."}
        />
        <StatTile
          label="Blocked"
          value={formatNumber(stats.blocked)}
          detail={
            stats.blocked > 0
              ? "Waiting on something. Unblock these first."
              : "Nothing is stuck."
          }
        />
        <StatTile
          label="Overdue"
          value={formatNumber(stats.overdue)}
          detail={
            stats.overdue > 0
              ? "Past the due date and not delivered."
              : "Everything is on time."
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        {DEPARTMENTS.map((meta) => (
          <DepartmentSection
            key={meta.value}
            meta={meta}
            tasks={tasks.filter((task) => task.department === meta.value)}
            team={team}
            eventId={event.id}
            userId={session.userId}
            isAdmin={session.isAdmin}
          />
        ))}
      </div>
    </>
  );
}
