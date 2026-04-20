import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatoRespuesta = (data) => {
  
      return data
        .map(
          (p) =>
            `${p.nombre_producto} - Stock: ${p.cantidad_producto}`
        )
        .join("\n");
  };

  const sendMessage = async () => {
    if (!message) return;

    const newChat = [...chat, { user: message }];
    setChat(newChat);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      setChat([
        ...newChat,
        { bot: formatoRespuesta(data.reply) }
      ]);

    } catch {
      setChat([
        ...newChat,
        { bot: "Error 😅" }
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Chat Inventario</h2>

      <div style={{ minHeight: 300, marginBottom: 20 }}>
        {chat.map((msg, i) => (
          <div key={i}>
            {msg.user && (
              <p>
                <b>🧑:</b> {msg.user}
              </p>
            )}

            {msg.bot && (
              <p style={{ whiteSpace: "pre-line" }}>
                <b>🤖:</b> {msg.bot}
              </p>
            )}
          </div>
        ))}
      </div>

      {loading && <p>Escribiendo...</p>}

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        style={{ width: "70%", padding: 10 }}
        placeholder="Escribe algo..."
      />

      <button onClick={sendMessage} style={{ padding: 10 }}>
        Enviar
      </button>
    </div>
  );
}

export default App;
