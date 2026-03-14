"use client";

export default function AdminRoleManagementScreen({ users = [], onRoleSwitch, switchingUserId }) {
  const scrutinyUsers = users.filter((user) => user.role?.name === "scrutiny_team");
  const momUsers = users.filter((user) => user.role?.name === "mom_team");

  const renderList = (list, targetRole, emptyText) => {
    if (!list.length) {
      return <p className="text-xs text-gray-500">{emptyText}</p>;
    }

    return (
      <div className="space-y-2">
        {list.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 p-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              type="button"
              disabled={switchingUserId === user.id}
              onClick={() => onRoleSwitch?.(user.id, targetRole)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {switchingUserId === user.id
                ? "Switching..."
                : targetRole === "mom_team"
                ? "Move to MoM"
                : "Move to Scrutiny"}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card mb-5">
      <h3 className="text-base font-semibold text-gray-900">Role Reassignment</h3>
      <p className="text-xs text-gray-500 mt-1 mb-3">
        Move users between Scrutiny Team and MoM Team using one-click reassignment.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Scrutiny Team</h4>
          {renderList(scrutinyUsers, "mom_team", "No users in scrutiny team")}
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2">MoM Team</h4>
          {renderList(momUsers, "scrutiny_team", "No users in MoM team")}
        </div>
      </div>
    </div>
  );
}
