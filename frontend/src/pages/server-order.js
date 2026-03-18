import React, { useState } from "react";
import menuData from "../lib/menuData";
import MenuButton from "../components/MenuButton";
import OrderCart from "../components/OrderCart";

export default function ServerOrderPage() {
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [orderType, setOrderType] = useState("Dine In");
  const [orderNote, setOrderNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Entrees");

  const categories = ["Appetizers", "Entrees", "Sides", "Drinks"];

  let filteredMenu = [];

  for (let i = 0; i < menuData.length; i++) {
    if (menuData[i].category === selectedCategory) {
      filteredMenu.push(menuData[i]);
    }
  }

  const addToCart = (item) => {
    let found = false;
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      let currentItem = cart[i];

      if (currentItem.id === item.id) {
        newCart.push({
          ...currentItem,
          quantity: currentItem.quantity + 1,
        });
        found = true;
      } else {
        newCart.push(currentItem);
      }
    }

    if (found === false) {
      newCart.push({
        ...item,
        quantity: 1,
      });
    }

    setCart(newCart);
  };

  const increaseQuantity = (id) => {
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      let item = cart[i];

      if (item.id === id) {
        newCart.push({
          ...item,
          quantity: item.quantity + 1,
        });
      } else {
        newCart.push(item);
      }
    }

    setCart(newCart);
  };

  const decreaseQuantity = (id) => {
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      let item = cart[i];

      if (item.id === id) {
        let newQuantity = item.quantity - 1;

        if (newQuantity > 0) {
          newCart.push({
            ...item,
            quantity: newQuantity,
          });
        }
      } else {
        newCart.push(item);
      }
    }

    setCart(newCart);
  };

  const removeItem = (id) => {
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id !== id) {
        newCart.push(cart[i]);
      }
    }

    setCart(newCart);
  };

  const handleSubmitOrder = () => {
    const orderData = {
      tableNumber: tableNumber,
      guestCount: guestCount,
      orderType: orderType,
      orderNote: orderNote,
      cart: cart,
    };

    console.log("Submitted Order:", orderData);
    alert("Order information was logged to the console.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111827",
        color: "white",
        padding: "16px",
      }}
    >
      <h1 style={{ marginBottom: "16px" }}>Server Order Entry</h1>

      <div
        style={{
          backgroundColor: "#1f2937",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
      >
        <div>
          <label>Table Number</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label>Guest Count</label>
          <input
            type="number"
            min="1"
            max="20"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label>Order Type</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option>Dine In</option>
            <option>Takeout</option>
          </select>
        </div>

        <div>
          <label>Order Note</label>
          <input
            type="text"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Special instructions"
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
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
            backgroundColor: "#1f2937",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginBottom: "12px" }}>Categories</h2>

          {categories.map(function (category) {
            let buttonColor = "#374151";

            if (category === selectedCategory) {
              buttonColor = "#2563eb";
            }

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "10px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: buttonColor,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div
          style={{
            backgroundColor: "#1f2937",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginBottom: "12px" }}>{selectedCategory}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {filteredMenu.map(function (item) {
              return (
                <MenuButton
                  key={item.id}
                  item={item}
                  addToCart={addToCart}
                />
              );
            })}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#1f2937",
            padding: "12px",
            borderRadius: "8px",
            position: "sticky",
            top: "16px",
          }}
        >
          <OrderCart
            cart={cart}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            removeItem={removeItem}
          />

          <button
            onClick={handleSubmitOrder}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#16a34a",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Submit Full Order
          </button>
        </div>
      </div>
    </div>
  );
}