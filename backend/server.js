  require("dotenv").config();
  const express = require("express");
  const cors = require("cors");
  const axios = require("axios");

  const app = express();
  app.use(cors());
  app.use(express.json());

  const mysql = require("mysql2/promise");

  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const tools = {
    traerProductos: async () => {
      const [rows] = await db.query("SELECT * FROM productos");
      return rows;
    },

    traerProductosBajos: async () => {
      const [rows] = await db.query(
        "SELECT * FROM productos WHERE cantidad_producto < 5",
      );
      return rows;
    },

  //   traerProductosAgotados: async () => {
  //     const [rows] = await db.query(
  //       "SELECT * FROM productos WHERE cantidad_producto = 0",
  //     );
  //     return rows;
  //   },
  //   traerProductosPorCategoria: async (categoria) => {
  //     const [rows] = await db.query(
  //       "SELECT * FROM productos WHERE categoria_producto = ?",
  //       [categoria],
  //     );
  //     return rows;
  //   },
    traerProductosPorNombre: async ({ nombre }) => {
      const [rows] = await db.query(
        "SELECT * FROM productos WHERE nombre_producto LIKE ?",
        [`%${nombre}%`],
      );
      return rows;
    },
  };

  const hablarIA = async (peticionUsuario) => {
    const response = await axios.post(
      process.env.AI_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `  
  Eres un asistente de inventario.

  Responde SOLO en JSON.

  Formato:
  {
    "tool": "traerProductos" | "traerProductosBajos" | "traerProductosAgotados" | "traerProductosPorCategoria" | "traerProductosPorNombre" | "none",
    "input": {
      "nombre": "string"
    }
  }

  No escribas nada más.
  `,
          },
          {
            role: "user",
            content: peticionUsuario,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
      },
    );

    return response.data.choices[0].message.content;
  };

  app.post("/chat", async (req, res) => {
    const peticionUsuario = req.body?.message;

    if (!peticionUsuario) {
      return res.json({ reply: "Escribe algo 😅" });
    }

    try {
      const respuestaIA = await hablarIA(peticionUsuario);

      console.log("IA:", respuestaIA);

      let action;

      try {
        action = JSON.parse(respuestaIA);
      } catch {
        return res.json({
          reply: "La IA no respondió bien 😅",
        });
      }

      if (action.tool === "none") {
        return res.json({
          reply: "No entiendo esa petición",
        });
      }

      const tool = tools[action.tool];

      if (!tool) {
        return res.json({
          reply: "Acción desconocida",
        });
      }

      const result = await tool(action.input || {});

      if (result.length === 0) {
        return res.json({
          reply: "No hay productos",
        });
      }

      res.json({
        reply: result,
      });
    } catch (error) {
      console.error(error.message);

      res.json({
        reply: "Error con la IA",
      });
    }
  });

  app.listen(process.env.PORT, () => {
    console.log(`Servidor en http://localhost:${process.env.PORT}`);
  });
