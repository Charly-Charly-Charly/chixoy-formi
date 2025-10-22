"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al crear usuario");

      const Swal = (await import("sweetalert2")).default;

      await Swal.fire({
        title: "Usuario Creado",
        html: `
          <div style="text-align:left;">
            <p><strong>Usuario:</strong> ${data.data.username}</p>
            <p><strong>Nombre:</strong> ${data.data.nombre}</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
      });

      setFormData({ username: "", password: "", nombre: "" });
    } catch (error: any) {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#202b52] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Panel de Administración
          </h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Volver al Inicio
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Crear Nuevo Usuario
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Usuario (requerido)
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña (requerido)
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre Completo (opcional)
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear Usuario"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              Instrucciones:
            </h3>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Completa el formulario con los datos del nuevo usuario</li>
              <li>
                Haz clic en "Crear Usuario" para registrar la información en la
                base de datos
              </li>
              <li>
                El nuevo usuario podrá iniciar sesión con las credenciales
                creadas
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
