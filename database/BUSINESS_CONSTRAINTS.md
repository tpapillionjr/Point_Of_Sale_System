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

## Pending model changes

- Half the party must be present for reservation.
Requires reservation and check-in/arrival tables.

- Only managers can set schedules.
Requires scheduling endpoints plus role-based auth on those routes.

- Only managers can purchase ingredients.
Requires purchasing/inventory procurement endpoints plus role-based auth.

- Only managers can generate sales reports.
Requires report endpoints plus role-based auth.

- Cooks only can close tickets.
Requires ticket update endpoints plus role-based auth.

- Restaurant capacity must be 101 or less.
Best enforced with a trigger or application check over total active seating capacity.

- POS locks after 5 failed logins.
Requires authentication, failed-attempt tracking, and account lock state.

- Staff cannot make less than their supervisor.
Requires supervisor relationships and payroll/pay-rate data.
