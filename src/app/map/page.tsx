export default function MapPage() {
  return (
    <iframe
      src="https://www.platypuspassions.com/stream-view"
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
