"use client";

import { useState } from "react";

const VALID_CODE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/i;

export default function MapPage() {
  const [input, setInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [error, setError] = useState("");

  function enter() {
    const code = input.trim().toUpperCase();
    if (VALID_CODE.test(code)) {
      setActiveCode(code);
      setError("");
    } else {
      setError("Invalid code");
    }
  }

  if (activeCode) {
    return (
      <iframe
        src={`https://www.platypuspassions.com/${activeCode}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          border: "none",
          display: "block",
        }}
        allow="autoplay; fullscreen; microphone"
        allowFullScreen
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "url('/AquaPrimeBG.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "monospace",
      }}
    >
      <style>{`
        .fire-ari {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 90vh;
          max-width: 45vw;
          object-fit: contain;
          object-position: left bottom;
          opacity: 0.92;
          pointer-events: none;
          user-select: none;
        }
        /* Portrait / mobile — shrink so it doesn't cover the input */
        @media (max-aspect-ratio: 3/4) {
          .fire-ari { height: 32vh; max-width: 38vw; opacity: 0.7; }
        }
        @media (min-aspect-ratio: 3/4) and (max-aspect-ratio: 1/1) {
          .fire-ari { height: 50vh; max-width: 40vw; opacity: 0.8; }
        }
        @media (min-aspect-ratio: 1/1) and (max-width: 900px) {
          .fire-ari { height: 65vh; max-width: 42vw; }
        }
      `}</style>

      {/* ARI / fire — left anchor */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Fire_Transparent.gif" alt="" className="fire-ari" />

      {/* Code entry */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "min(340px, 88vw)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bwlogo.png"
          alt="AquaPrime"
          style={{ width: "120px", opacity: 0.9, marginBottom: "4px" }}
        />

        <span
          style={{
            color: "#00ffff",
            fontSize: "11px",
            letterSpacing: "6px",
            textTransform: "uppercase",
            textShadow: "0 0 12px #00ffff",
          }}
        >
          THE GRID IS LIVE
        </span>

        <p
          style={{
            color: "#00ffff",
            fontSize: "9px",
            letterSpacing: "3px",
            margin: 0,
            textShadow: "0 0 8px #00ffff",
          }}
        >
          ROOM CODE
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) =>
            setInput(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6),
            )
          }
          onKeyDown={(e) => e.key === "Enter" && enter()}
          placeholder="— — — — — —"
          maxLength={6}
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.75)",
            border: "1px solid #00ffff",
            color: "#00ffff",
            fontFamily: "monospace",
            fontSize: "22px",
            textAlign: "center",
            letterSpacing: "8px",
            padding: "10px 12px",
            outline: "none",
            boxShadow: "0 0 10px rgba(0,255,255,0.3) inset",
          }}
        />
        {error && (
          <p
            style={{
              color: "#ff4444",
              fontSize: "9px",
              margin: 0,
              letterSpacing: "2px",
            }}
          >
            {error}
          </p>
        )}
        <button
          onClick={enter}
          style={{
            width: "100%",
            background: input.length === 6 ? "#00ffff" : "rgba(0,255,255,0.15)",
            color: input.length === 6 ? "#000" : "#00ffff",
            fontFamily: "monospace",
            fontWeight: "bold",
            fontSize: "11px",
            letterSpacing: "3px",
            padding: "10px",
            border: "1px solid #00ffff",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          ACCESS
        </button>
      </div>
    </div>
  );
}
