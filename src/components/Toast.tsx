"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

// ✅ Named Export
export function Toast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "14px 18px",
        borderRadius: 10,
        background: type === "success" ? "#16a34a" : "#dc2626",
        color: "white",
        fontWeight: 500,
        boxShadow: "0 5px 20px rgba(0,0,0,0.25)",
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  );
}

// ✅ Default Export bleibt auch da (schadet nicht)
export default Toast;