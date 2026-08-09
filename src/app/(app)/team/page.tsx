import type { Metadata } from "next";

import { MemberRow } from "@/app/(app)/team/member-row";
import { Card, EmptyNote, PageHeader } from "@/components/ui";
import { DEPARTMENTS } from "@/lib/domain";
import { getPrimaryEvent } from "@/lib/events";
import { requireSession } from "@/lib/session";
import { getTasks, getTeam } from "@/lib/tasks";
import type { TeamMember } from "@/lib/tasks";

export const metadata: Metadata = {
  title: "Team",
};

export default async function TeamPage() {
  const session = await requireSession();
  const event = await getPrimaryEvent();
  const [team, tasks] = await Promise.all([
    getTeam(),
    event ? getTasks(event.id) : Promise.resolve([]),
  ]);

  const openByPerson = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === "done" || !task.assignee_id) continue;
    openByPerson.set(
      task.assignee_id,
      (openByPerson.get(task.assignee_id) ?? 0) + 1,
    );
  }

  const groups: { key: string; label: string; members: TeamMember[] }[] = [
    ...DEPARTMENTS.map((department) => ({
      key: department.value,
      label: department.label,
      members: team.filter((member) => member.department === department.value),
    })),
    {
      key: "unassigned",
      label: "No team yet",
      members: team.filter((member) => !member.department),
    },
  ].filter((group) => group.members.length > 0);

  return (
    <>
      <PageHeader
        eyebrow={event?.name ?? "VMI Collective"}
        title="Team"
        description="Everyone with access to this dashboard, and what they're carrying."
      />

      {team.length === 0 ? (
        <Card className="p-8">
          <EmptyNote>
            No one has an account yet. Add people in Supabase under
            Authentication → Users, tick Auto Confirm User, and they will appear
            here for you to place on a team.
          </EmptyNote>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card key={group.key}>
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-[1.125rem] font-medium text-ink">
                  {group.label}
                </h2>
                <span className="tnum font-mono text-[0.6875rem] tracking-[0.1em] text-ink-3">
                  {group.members.length}
                </span>
              </header>
              <ul>
                {group.members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    openTaskCount={openByPerson.get(member.id) ?? 0}
                    isAdmin={session.isAdmin}
                    isSelf={member.id === session.userId}
                  />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

   
    </>
  );
}
