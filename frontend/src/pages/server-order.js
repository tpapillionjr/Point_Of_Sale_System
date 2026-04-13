import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MenuButton from "../components/MenuButton";
import OrderCart from "../components/OrderCart";
import { verifyManager, createOrder, addItemsToOrder, fetchActiveOrderByTable, fetchTables, fetchItems } from "../lib/api";

export default function ServerOrderPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [sentItemIds, setSentItemIds] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [takeoutName, setTakeoutName] = useState("");
  const [takeoutPhone, setTakeoutPhone] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [orderType, setOrderType] = useState("Dine In");
  const [orderNote, setOrderNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pendingQty, setPendingQty] = useState(1);
  const [showQtyPad, setShowQtyPad] = useState(false);
  const [qtyInput, setQtyInput] = useState("");
  const [tables, setTables] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  const [managerPin, setManagerPin] = useState("");
  const [approvalError, setApprovalError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showGuestPad, setShowGuestPad] = useState(false);
  const [guestInput, setGuestInput] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const [menuItems, setMenuItems] = useState([]);

  const categories = useMemo(() => [...new Set(menuItems.map((i) => i.category))], [menuItems]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);
  const filteredMenu = useMemo(
    () => menuItems.filter((item) => item.category === selectedCategory),
    [selectedCategory, menuItems]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const storedEmployee = localStorage.getItem("currentEmployee");
    if (storedEmployee) {
      setEmployee(JSON.parse(storedEmployee));
    }

    async function loadTables() {
      try {
        const rows = await fetchTables();
        setTables(rows);
        if (router.query.table) {
          setTableNumber(String(router.query.table));
        }
        if (router.query.guests) {
          setGuestCount(Number(router.query.guests));
        }
        if (router.query.takeoutName) {
          setTakeoutName(String(router.query.takeoutName));
        }
        if (router.query.takeoutPhone) {
          setTakeoutPhone(String(router.query.takeoutPhone));
        }
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      }
    }

    async function loadMenu() {
      try {
        const rows = await fetchItems();
        setMenuItems(rows.map((item) => ({
          id: item.menuItemId,
          name: item.name,
          category: item.category,
          price: Number(item.basePrice),
          description: item.description ?? "",
          commonAllergens: item.commonAllergens ?? "",
          photoUrl: item.photoUrl ?? "",
        })));
      } catch {
        // non-fatal — menu stays empty
      }
    }

    loadTables();
    loadMenu();
  }, [router.isReady, router.query.table, router.query.guests, router.query.takeoutName, router.query.takeoutPhone]);

  useEffect(() => {
    if (!tableNumber) return;

    const selectedTable = tables.find((t) => String(t.tableNumber) === String(tableNumber));
    if (!selectedTable || selectedTable.status !== "occupied") return;

    let active = true;

    fetchActiveOrderByTable(tableNumber)
      .then((order) => {
        if (!active) return;
        const merged = [];
        for (const item of order.items) {
          const existing = merged.find((c) => c.id === item.menuItemId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            merged.push({ id: item.menuItemId, name: item.name, price: Number(item.price), quantity: item.quantity });
          }
        }
        setCart(merged);
        setSentItemIds(merged.map((item) => item.id));
        setSubmittedOrder({ orderId: order.orderId });
      })
      .catch(() => {});

    return () => { active = false; };
  }, [tableNumber, tables]);

  const addToCart = (item) => {
    const qty = pendingQty;

    // If this item was already sent, keep it as a separate pending entry
    if (sentItemIds.includes(item.id)) {
      const pendingId = `${item.id}_pending`;
      setCart((prev) => {
        const existing = prev.find((c) => c.id === pendingId);
        if (existing) {
          return prev.map((c) => c.id === pendingId ? { ...c, quantity: c.quantity + qty } : c);
        }
        return [...prev, { ...item, id: pendingId, menuItemId: item.id, quantity: qty }];
      });
      setPendingQty(1);
      return;
    }

    // Normal merge for unsent items
    let found = false;
    const newCart = [];
    for (let i = 0; i < cart.length; i += 1) {
      const currentItem = cart[i];
      if (currentItem.id === item.id) {
        newCart.push({ ...currentItem, quantity: currentItem.quantity + qty });
        found = true;
      } else {
        newCart.push(currentItem);
      }
    }
    if (!found) {
      newCart.push({ ...item, quantity: qty });
    }
    setCart(newCart);
    setPendingQty(1);
  };

  const handleConfirmMenuItem = () => {
    if (!selectedMenuItem) {
      return;
    }

    addToCart(selectedMenuItem);
    setSelectedMenuItem(null);
  };

  const handleQtyDigit = (digit) => {
    setQtyInput((prev) => (prev + digit).slice(0, 3));
  };

  const handleQtyConfirm = () => {
    const parsed = parseInt(qtyInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPendingQty(parsed);
    }
    setQtyInput("");
    setShowQtyPad(false);
  };

  const handleQtyClear = () => {
    setQtyInput("");
  };

  const removeItem = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const handleRemoveItem = (id) => {
    if (sentItemIds.includes(id)) {
      setPendingRemoveId(id);
      setManagerPin("");
      setApprovalError(null);
    } else {
      removeItem(id);
    }
  };

  const handleManagerApproval = useCallback(async () => {
    if (managerPin.length !== 4) return;
    try {
      setIsVerifying(true);
      setApprovalError(null);
      await verifyManager(managerPin);
      removeItem(pendingRemoveId);
      setSentItemIds((prev) => prev.filter((sid) => sid !== pendingRemoveId));
      setPendingRemoveId(null);
      setManagerPin("");
    } catch (err) {
      setApprovalError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }, [managerPin, pendingRemoveId]);

  useEffect(() => {
    if (pendingRemoveId === null) return;

    function handleKey(e) {
      if (e.key >= "0" && e.key <= "9") {
        setManagerPin((p) => (p.length < 4 ? p + e.key : p));
      } else if (e.key === "Backspace") {
        setManagerPin((p) => p.slice(0, -1));
      } else if (e.key === "Enter") {
        handleManagerApproval();
      } else if (e.key === "Escape") {
        setPendingRemoveId(null);
        setManagerPin("");
        setApprovalError(null);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pendingRemoveId, handleManagerApproval]);

  async function handleSubmitOrder() {
    if (!employee?.userId) {
      setMessage({ type: "error", text: "Clock in and log in before sending an order." });
      return;
    }

    const selectedTable = tables.find((table) => String(table.tableNumber) === String(tableNumber));
    if (!selectedTable) {
      setMessage({ type: "error", text: "Select a valid table." });
      return;
    }

    if (cart.length === 0) {
      setMessage({ type: "error", text: "Add at least one item to the order." });
      return;
    }

    const isTakeoutTable = String(tableNumber) === "10000";
    const payload = {
      tableId: selectedTable.tableId,
      createdBy: employee.userId,
      guestCount: Number(guestCount),
      orderType: isTakeoutTable ? "Takeout" : "Dine_in",
      orderChannel: isTakeoutTable ? "Phone" : "In_Store",
      orderNote: orderNote,
      items: cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      discountAmount: 0,
      tax: 0,
      serviceCharge: 0,
      isSplitCheck: false,
      ...(isTakeoutTable && { takeoutName, takeoutPhone }),
    };

    const newItems = cart.filter((item) => !sentItemIds.includes(item.id) || String(item.id).endsWith("_pending"));

    try {
      setIsSubmitting(true);

      let order;

      if (submittedOrder?.orderId) {
        if (newItems.length === 0) {
          setMessage({ type: "error", text: "No new items to send." });
          return;
        }
        order = await addItemsToOrder(
          submittedOrder.orderId,
          newItems.map((item) => ({ menuItemId: item.menuItemId ?? item.id, quantity: item.quantity, price: Number(item.price) })),
          employee.userId
        );
        order.orderId = submittedOrder.orderId;

        // Merge pending entries into their sent counterparts and turn them green
        setCart((prev) => {
          const merged = prev.map((c) => {
            if (!String(c.id).endsWith("_pending")) return c;
            return null; // remove pending entry
          });
          return merged
            .filter(Boolean)
            .map((c) => {
              const pendingEntry = prev.find((p) => p.menuItemId === c.id && String(p.id).endsWith("_pending"));
              if (pendingEntry) return { ...c, quantity: c.quantity + pendingEntry.quantity };
              return c;
            });
        });
        setSentItemIds((prev) => [...new Set([...prev, ...newItems.map((i) => i.menuItemId ?? i.id)])]);
      } else {
        order = await createOrder(payload);
        const newSentIds = cart.map((item) => item.id);
        setSentItemIds((prev) => [...new Set([...prev, ...newSentIds])]);
      }

      setSubmittedOrder(order);
      setMessage({
        type: "success",
        text: `Items sent for table ${selectedTable.tableNumber}.`,
      });
      localStorage.setItem(
        "currentOrder",
        JSON.stringify({ orderId: order.orderId, tableNumber, guestCount, orderType, orderNote, cart })
      );
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "auto",
        backgroundColor: "transparent",
        color: "#111827",
        padding: 0,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>Server Order Entry</h1>
        <p style={{ marginTop: "6px", color: "#6b7280", margin: "6px 0 0" }}>
          Select a live table, add items, and submit the order.
        </p>
        {message && (
          <p style={{ margin: "12px 0 0", color: message.type === "error" ? "#b91c1c" : "#166534", fontWeight: "600" }}>
            {message.text}
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Table</label>
          <div
            style={{
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "2px solid #2563eb",
              backgroundColor: "#eff6ff",
              fontSize: "14px",
              fontWeight: "700",
              color: "#1d4ed8",
              boxSizing: "border-box",
            }}
          >
            {String(tableNumber) === "10000"
              ? `Takeout${takeoutName ? ` — ${takeoutName}` : ""}`
              : tableNumber ? `Table ${tableNumber}` : "No table selected"}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Guest Count</label>
          <button
            onClick={() => { setGuestInput(""); setShowGuestPad(true); }}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              backgroundColor: "white",
              textAlign: "left",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            {guestCount}
          </button>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Order Type</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              backgroundColor: "white",
              boxSizing: "border-box",
            }}
          >
            <option>Dine In</option>
            <option>Takeout</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Order Note</label>
          <input
            type="text"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Special instructions"
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr 320px",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#111827" }}>Categories</h2>

          {categories.map((category) => {
            const isActive = category === selectedCategory;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  border: "none",
                  borderRadius: "10px",
                  backgroundColor: isActive ? "#2563eb" : "#f3f4f6",
                  color: isActive ? "white" : "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  textAlign: "left",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#111827" }}>{selectedCategory}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {filteredMenu.map((item) => (
              <MenuButton key={item.id} item={item} addToCart={() => setSelectedMenuItem(item)} />
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            position: "sticky",
            top: "16px",
          }}
        >
          <OrderCart
            cart={cart}
            sentItemIds={sentItemIds}
            removeItem={handleRemoveItem}
          />

          <button
            onClick={() => {
              setQtyInput("");
              setShowQtyPad(true);
            }}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "12px",
              border: "2px solid",
              borderColor: pendingQty > 1 ? "#f59e0b" : "#d1d5db",
              borderRadius: "10px",
              backgroundColor: pendingQty > 1 ? "#fef3c7" : "#f9fafb",
              color: pendingQty > 1 ? "#92400e" : "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.05em",
            }}
          >
            {pendingQty > 1 ? `QTY: ${pendingQty} — tap an item` : "QTY"}
          </button>

          <button
            onClick={() => handleSubmitOrder("SEND")}
            disabled={isSubmitting}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "14px 8px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#16a34a",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.05em",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            SEND
          </button>

          <button
            onClick={() => {
              if (!submittedOrder?.orderId) {
                setMessage({
                  type: "error",
                  text: "Send the order successfully before closing the tab.",
                });
                return;
              }

              localStorage.setItem(
                "currentOrder",
                JSON.stringify({
                  orderId: submittedOrder.orderId,
                  tableNumber,
                  guestCount,
                  orderType,
                  orderNote,
                  cart,
                })
              );
              router.push("/checkout");
            }}
            disabled={cart.length === 0 || !submittedOrder?.orderId}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#111827",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.05em",
              opacity: cart.length === 0 || !submittedOrder?.orderId ? 0.6 : 1,
            }}
          >
            CLOSE TAB
          </button>
        </div>
      </div>

      {selectedMenuItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-item-confirm-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "rgba(15,23,42,0.45)",
          }}
          onClick={() => setSelectedMenuItem(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              borderRadius: "12px",
              backgroundColor: "white",
              boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
              overflow: "hidden",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {selectedMenuItem.category}
                  </p>
                  <h2 id="menu-item-confirm-title" style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
                    {selectedMenuItem.name}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#166534" }}>
                  ${selectedMenuItem.price.toFixed(2)}
                </p>
              </div>

              <p style={{ margin: "16px 0 0", fontSize: "15px", lineHeight: 1.55, color: "#4b5563" }}>
                {selectedMenuItem.description || "No description is available for this item."}
              </p>

              {selectedMenuItem.commonAllergens ? (
                <p style={{ margin: "12px 0 0", fontSize: "13px", color: "#92400e", fontWeight: "700" }}>
                  Allergens: {selectedMenuItem.commonAllergens}
                </p>
              ) : null}

              <div
                style={{
                  marginTop: "18px",
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: "700",
                }}
              >
                Quantity to add: {pendingQty}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedMenuItem(null)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMenuItem}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Confirm Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingRemoveId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div className="ci-card">
            <p className="ci-sub" style={{ fontSize: "1rem", fontWeight: 700, color: "#4a6484" }}>
              Manager Approval Required
            </p>
            <p className="ci-sub">Enter manager PIN to remove item.</p>

            <div className="ci-dots">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={i < managerPin.length ? "ci-dot ci-dot--filled" : "ci-dot"} />
              ))}
            </div>

            {approvalError && (
              <p className="ci-status ci-status--error">{approvalError}</p>
            )}

            <div className="ci-grid">
              {["1","2","3","4","5","6","7","8","9"].map((d) => (
                <button
                  key={d}
                  className="ci-btn"
                  onClick={() => setManagerPin((p) => (p.length < 4 ? p + d : p))}
                >
                  {d}
                </button>
              ))}
              <button
                className="ci-btn ci-btn--ghost"
                onClick={() => setManagerPin((p) => p.slice(0, -1))}
              >
                ⌫
              </button>
              <button
                className="ci-btn"
                onClick={() => setManagerPin((p) => (p.length < 4 ? p + "0" : p))}
              >
                0
              </button>
              <button
                className="ci-btn ci-btn--enter"
                onClick={handleManagerApproval}
                disabled={managerPin.length !== 4 || isVerifying}
              >
                {isVerifying ? "..." : "✓"}
              </button>
            </div>

            <button
              onClick={() => { setPendingRemoveId(null); setManagerPin(""); setApprovalError(null); }}
              style={{ width: "100%", padding: "10px", border: "1.5px solid #c8d8e8", borderRadius: "12px", backgroundColor: "white", color: "#c0392b", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showGuestPad && (() => {
        const selectedTable = tables.find((t) => String(t.tableNumber) === String(tableNumber));
        const maxGuests = selectedTable?.capacity ?? 99;
        const val = parseInt(guestInput, 10);
        const overMax = val > maxGuests;
        const confirmGuest = () => {
          if (!val || val < 1 || overMax) return;
          setGuestCount(val);
          setShowGuestPad(false);
        };
        return (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
            onClick={() => setShowGuestPad(false)}
          >
            <div className="ci-card" onClick={(e) => e.stopPropagation()}>
              <p className="ci-sub" style={{ fontSize: "1rem", fontWeight: 700, color: "#4a6484" }}>Update Guest Count</p>
              <p className="ci-sub">Max {maxGuests} seats</p>
              <div className="ci-dots" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.1em", color: overMax ? "#dc2626" : undefined }}>
                {guestInput || "0"}
              </div>
              {overMax && (
                <p className="ci-status ci-status--error">Exceeds max seats ({maxGuests})</p>
              )}
              <div className="ci-grid">
                {["1","2","3","4","5","6","7","8","9"].map((d) => (
                  <button key={d} className="ci-btn" onClick={() => setGuestInput((p) => p.length < 2 ? p + d : p)}>{d}</button>
                ))}
                <button className="ci-btn ci-btn--ghost" onClick={() => setGuestInput((p) => p.slice(0, -1))}>⌫</button>
                <button className="ci-btn" onClick={() => setGuestInput((p) => p.length < 2 ? p + "0" : p)}>0</button>
                <button className="ci-btn ci-btn--enter" onClick={confirmGuest} disabled={overMax || !val || val < 1}>✓</button>
              </div>
              <button
                onClick={() => setShowGuestPad(false)}
                style={{ width: "100%", padding: "10px", border: "1.5px solid #c8d8e8", borderRadius: "12px", backgroundColor: "white", color: "#c0392b", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {showQtyPad && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowQtyPad(false)}
        >
          <div className="ci-card" onClick={(e) => e.stopPropagation()}>
            <p className="ci-sub" style={{ fontSize: "1rem", fontWeight: 700, color: "#4a6484" }}>Enter Quantity</p>
            <div className="ci-dots" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.1em" }}>
              {qtyInput || "0"}
            </div>
            <div className="ci-grid">
              {["1","2","3","4","5","6","7","8","9"].map((d) => (
                <button key={d} className="ci-btn" onClick={() => handleQtyDigit(d)}>{d}</button>
              ))}
              <button className="ci-btn ci-btn--ghost" onClick={handleQtyClear}>⌫</button>
              <button className="ci-btn" onClick={() => handleQtyDigit("0")}>0</button>
              <button className="ci-btn ci-btn--enter" onClick={handleQtyConfirm}>✓</button>
            </div>
            <button
              onClick={() => setShowQtyPad(false)}
              style={{ width: "100%", padding: "10px", border: "1.5px solid #c8d8e8", borderRadius: "12px", backgroundColor: "white", color: "#c0392b", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
