"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VALID_CODE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/i;
const EMBED_ORIGIN = "https://www.platypuspassions.com";
const READY_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PageState = "entry" | "loading" | "active" | "error";

// Future: extend with "planet" | "gallery" when new experiences ship
type MapMode = "map";

// ---------------------------------------------------------------------------
// MapPage
// ---------------------------------------------------------------------------
export default function MapPage() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [pageState, setPageState] = useState<PageState>("entry");
  const [error, setError] = useState("");
  const [mode] = useState<MapMode>("map");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -- postMessage listener: wait for aquaprime:ready from iframe ----------
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== EMBED_ORIGIN) return;
      if (e.data?.type === "aquaprime:ready") {
        setPageState("active");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
      // Future: handle aquaprime:tile-select here
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // -- Timeout fallback: if ready never arrives ----------------------------
  useEffect(() => {
    if (pageState === "loading") {
      timeoutRef.current = setTimeout(() => {
        setPageState("error");
        setError(
          "Map took too long to load. Check your connection and try again.",
        );
      }, READY_TIMEOUT_MS);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pageState]);

  const enter = useCallback(() => {
    const trimmed = input.trim().toUpperCase();
    if (VALID_CODE.test(trimmed)) {
      setCode(trimmed);
      setError("");
      setPageState("loading");
    } else {
      setError("Invalid code");
    }
  }, [input]);

  const exit = useCallback(() => {
    setPageState("entry");
    setCode("");
    setError("");
  }, []);

  const retry = useCallback(() => {
    if (code) {
      setError("");
      setPageState("loading");
    }
  }, [code]);

  // ── Active / Loading: show iframe ──────────────────────────────────────
  if (pageState === "loading" || pageState === "active") {
    const iframeSrc = `${EMBED_ORIGIN}/embed/map?room=${code}`;

    return (
      <div style={{ position: "fixed", inset: 0, background: "#000" }}>
        {/* Loading overlay — fades out when active */}
        {pageState === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              background: "#000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid rgba(0,255,255,0.3)",
                borderTopColor: "#00ffff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span
              style={{
                color: "#00ffff",
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Connecting to grid...
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* The map iframe */}
        <iframe
          src={iframeSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          allow="autoplay; fullscreen; microphone"
          allowFullScreen
        />

        {/* Exit button (top-left, always visible when active) */}
        {pageState === "active" && (
          <button
            onClick={exit}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 30,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              transition: "opacity 0.2s",
              opacity: 0.5,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            title="Exit map"
          >
            &times;
          </button>
        )}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "monospace",
        }}
      >
        <span
          style={{
            color: "#f87171",
            fontSize: 12,
            letterSpacing: 2,
            textAlign: "center",
            maxWidth: "80vw",
          }}
        >
          {error}
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={retry}
            style={{
              background: "rgba(0,255,255,0.15)",
              color: "#00ffff",
              border: "1px solid #00ffff",
              padding: "8px 20px",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 2,
              cursor: "pointer",
            }}
          >
            RETRY
          </button>
          <button
            onClick={exit}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#9ca3af",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "8px 20px",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 2,
              cursor: "pointer",
            }}
          >
            BACK
          </button>
        </div>
      </div>
    );
  }

  // ── Entry state: room code input ───────────────────────────────────────
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
