import { useState, useEffect } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { getStoredEmployee } from "../../lib/session";
import { createUser, fetchUsers, deactivateUser } from "../../lib/api";

export default function CreateEmployeesPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    pin_code: "",
    role: "employee",
  });

  const employee = getStoredEmployee();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await createUser({ ...form, requestingUserId: employee?.userId });
      setMessage(`Account created for ${form.name}.`);
      setForm({ name: "", email: "", pin_code: "", role: "employee" });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeactivate(userId, name) {
    setMessage("");
    setError("");

    try {
      await deactivateUser(userId, employee?.userId);
      setMessage(`${name} has been deactivated.`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <BackOfficeShell
      title="Create Employees"
      description="Create new employee accounts and manage existing staff."
    >
      <div className="grid gap-8 lg:grid-cols-2">

        {/* Create Account Form */}
        <div className="rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">New Account</h2>

          {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="employee@email.com"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">PIN (4 digits)</label>
              <input
                type="password"
                value={form.pin_code}
                onChange={(e) => setForm({ ...form, pin_code: e.target.value.slice(0, 4) })}
                placeholder="••••"
                maxLength={4}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="employee">Server</option>
                <option value="kitchen">Kitchen</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Existing Users List */}
        <div className="rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Current Staff</h2>

          {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

          {!isLoading && users.length === 0 && (
            <p className="text-sm text-gray-500">No employees found.</p>
          )}

          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email} · {user.role}</p>
                </div>

                {user.is_active ? (
                  <button
                    onClick={() => handleDeactivate(user.user_id, user.name)}
                    className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                  >
                    Deactivate
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Inactive</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </BackOfficeShell>
  );
}
