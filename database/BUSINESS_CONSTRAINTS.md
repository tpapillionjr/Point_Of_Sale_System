# Business Constraints

## Enforced now

- Party size must be between 1 and 8.
- Transaction must include at least one priced item.
- Servers cannot apply discounts.
- A table cannot be reseated while it still has an active order.
- Order creation checks menu item activity and available inventory.
- Inventory is decremented automatically when an order is created successfully.
- Employees must be scheduled to clock in.
- No more than 8 staff can be clocked in at once.
- Servers must declare tips before clocking out.
- Only managers can see the Back Office and Reports tabs in the frontend.
- Non-managers are redirected away from `/back-office` and `/reports`.
- Kitchen tickets can be marked `done` only by kitchen staff or managers.

## Pending model changes

- Half the party must be present for reservation.
Requires reservation and check-in/arrival tables.

- Only managers can set schedules.
Schema now includes `Employee_Shift.scheduled_by`, but scheduling endpoints and role-based auth still need to be implemented.

- Only managers can purchase ingredients.
Requires purchasing/inventory procurement endpoints plus role-based auth.

- Only managers can generate sales reports.
Frontend access is restricted now, but backend report endpoints still need role-based auth once those endpoints exist.

- Restaurant capacity must be 101 or less.
Best enforced with a trigger or application check over total active seating capacity.

- POS locks after 5 failed logins.
Schema now includes `Users.failed_pin_attempts` and `Users.is_pos_locked`, but the login flow does not yet increment attempts or enforce the lock.

- Staff cannot make less than their supervisor.
Requires supervisor relationships and payroll/pay-rate data.
