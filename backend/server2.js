require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());


const hablarIA = async (mensaje) => {
  const response = await axios.post(
    process.env.AI_URL,
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Eres un asistente útil y respondes de forma clara y breve."
        },
        {
          role: "user",
          content: mensaje
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`
      }
    }
  );

  return response.data.choices[0].message.content;
};

app.post("/chat", async (req, res) => {
  const mensaje = req.body?.message;

  if (!mensaje) {
    return res.json({ reply: "Escribe algo 😅" });
  }

  try {
    const respuestaIA = await hablarIA(mensaje);

    res.json({
      reply: respuestaIA
    });

  } catch (error) {
    console.error(error.message);

    res.json({
      reply: "Error con la IA"
    });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`);
});
