import { useState, useEffect } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { getStoredEmployee } from "../../lib/session";
import { createUser, fetchUsers, deactivateUser, resetUserPassword } from "../../lib/api";

export default function CreateEmployeesPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    password: "",
  });

  const employee = getStoredEmployee();
  const resetEmailIsValid = resetForm.email.trim().includes("@");
  const resetPasswordIsValid = resetForm.password.length >= 6;
  const canResetPassword = resetEmailIsValid && resetPasswordIsValid && !isResetting;

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
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      await createUser({ name: fullName, email: form.email, password: form.password, role: form.role, requestingUserId: employee?.userId });
      setMessage(`Account created for ${fullName}.`);
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "employee" });
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

  async function handleResetPassword(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!resetEmailIsValid || !resetPasswordIsValid) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }

    setIsResetting(true);

    try {
      await resetUserPassword({
        email: resetForm.email,
        password: resetForm.password,
        requestingUserId: employee?.userId,
      });
      setMessage(`Password reset for ${resetForm.email.trim().toLowerCase()}.`);
      setResetForm({ email: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <BackOfficeShell
      title="Create Employees"
      description="Create new employee accounts and manage existing staff."
    >
      <div className="grid gap-8 lg:grid-cols-2">

        <div className="flex flex-col gap-6">
          {/* Create Account Form */}
          <div className="rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">New Account</h2>

            {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="First name"
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Last name"
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
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
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="lumi-report-select"
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

          {/* Password Reset Form */}
          <div className="rounded-xl border p-6">
            <h2 className="mb-2 text-lg font-semibold">Reset Password</h2>
            <p className="mb-4 text-sm text-gray-500">
              Enter an existing staff email and a new password.
            </p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Employee Email</label>
                <input
                  type="email"
                  value={resetForm.email}
                  onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                  placeholder="employee@email.com"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={!canResetPassword}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isResetting && <span className="lumi-loader lumi-loader--small" aria-hidden="true" />}
                {isResetting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Users List */}
        <div className="rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Current Staff</h2>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="lumi-loader lumi-loader--small" aria-hidden="true" />
              <span>Loading staff...</span>
            </div>
          )}

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
