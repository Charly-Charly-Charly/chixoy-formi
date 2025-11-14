"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  created_at: string;
  institucionId?: number;
  rol: string;
}

interface Institucion {
  id: number;
  nombre: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
    institucionId: "",
    rol: "usuario",
  });
  const [loading, setLoading] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [activeTab, setActiveTab] = useState<"crear" | "usuarios">("crear");
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loadingInstituciones, setLoadingInstituciones] = useState(true);

  useEffect(() => {
    cargarInstituciones();
    cargarUsuarios();
  }, []);

  const cargarInstituciones = async () => {
    try {
      const res = await fetch("/api/instituciones");
      const data = await res.json();

      if (Array.isArray(data)) setInstituciones(data);
    } catch (error) {
      console.error("Error cargando instituciones:", error);
    } finally {
      setLoadingInstituciones(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await fetch("/api/auth/get-users");
      const data = await res.json();
      if (res.ok) setUsuarios(data.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedSQL("");

    try {
      if (!formData.institucionId)
        throw new Error("Debe seleccionar una institución");

      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          institucionId: Number.parseInt(formData.institucionId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear usuario");

      setGeneratedSQL(data.data.sqlQuery);

      await Swal.fire({
        title: "Usuario Creado",
        html: `
          <div class="text-left space-y-4">
            <div>
              <p><strong>Usuario:</strong> ${data.data.username}</p>
              <p><strong>Nombre:</strong> ${data.data.nombre}</p>
              <p><strong>Rol:</strong> ${
                formData.rol === "admin" ? "Administrador" : "Usuario"
              }</p>
            </div>
           
            <div>
              <p class="text-sm font-semibold text-gray-700">Plantilla de Correo:</p>
              <div class="bg-blue-50 p-3 rounded text-xs overflow-y-auto max-h-64 whitespace-pre-wrap border border-blue-200">
                ${data.data.emailTemplate}
              </div>
              <p class="text-xs text-gray-600 mt-2">Copia esta plantilla y envíala por correo al usuario</p>
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
        width: "800px",
      });

      setFormData({
        username: "",
        password: "",
        nombre: "",
        institucionId: "",
        rol: "usuario",
      });
      cargarUsuarios();
    } catch (error: any) {
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

  const handleResetPassword = async (username: string) => {
    const { value: newPassword } = await Swal.fire({
      title: "Reiniciar Contraseña",
      input: "password",
      inputLabel: `Nueva contraseña para ${username}`,
      inputPlaceholder: "Ingresa la nueva contraseña",
      inputAttributes: {
        minlength: "6",
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Reiniciar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "La contraseña es requerida";
        if (value.length < 6) return "Debe tener al menos 6 caracteres";
      },
    });

    if (!newPassword) return;

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error al reiniciar contraseña");

      await Swal.fire({
        title: "Contraseña Reiniciada",
        html: `
          <div class="text-left">
            <p><strong>Usuario:</strong> ${username}</p>
            <p><strong>Nueva contraseña:</strong> ${newPassword}</p>
            <p class="text-sm text-gray-600 mt-2">Ejecuta este SQL en tu base de datos:</p>
            <div class="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
              ${data.data.sqlQuery}
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
      });
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "Cerrar",
      });
    }
  };

  const getNombreInstitucion = (id?: number): string => {
    if (!id) return "N/A";
    const inst = instituciones.find((i) => i.id === id);
    return inst?.nombre || "N/A";
  };

  return (
    <div className="min-h-screen bg-[#202b52] p-4">
      <div className="max-w-4xl mx-auto">
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

        <div className="flex gap-4 mb-6">
          {["crear", "usuarios"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "crear" | "usuarios")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              {tab === "crear" ? "Crear Usuario" : "Gestionar Usuarios"}
            </button>
          ))}
        </div>

        {activeTab === "crear" ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Crear Nuevo Usuario
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                {
                  id: "username",
                  label: "Usuario (requerido)",
                  type: "text",
                  required: true,
                },
                {
                  id: "password",
                  label: "Contraseña (requerido)",
                  type: "password",
                  required: true,
                },
                {
                  id: "nombre",
                  label: "Nombre Completo (opcional)",
                  type: "text",
                  required: false,
                },
              ].map((f) => (
                <div key={f.id}>
                  <label
                    htmlFor={f.id}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    id={f.id}
                    value={(formData as any)[f.id]}
                    onChange={(e) =>
                      setFormData({ ...formData, [f.id]: e.target.value })
                    }
                    required={f.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institución
                </label>
                <select
                  value={formData.institucionId}
                  onChange={(e) =>
                    setFormData({ ...formData, institucionId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
                  required
                >
                  <option value="">Selecciona una institución...</option>
                  {loadingInstituciones ? (
                    <option disabled>Cargando...</option>
                  ) : (
                    instituciones.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) =>
                    setFormData({ ...formData, rol: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {loading ? "Generando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Gestionar Usuarios
            </h2>
            {loadingUsuarios ? (
              <p className="text-center text-gray-600">Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
              <p className="text-center text-gray-600">
                No hay usuarios disponibles
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {[
                        "ID",
                        "Usuario",
                        "Nombre",
                        "Institución",
                        "Fecha Creación",
                        "Rol",
                        "Acciones",
                      ].map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left text-sm font-semibold text-gray-800"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {u.id}
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-gray-700">
                          {u.username}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {u.nombre}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {getNombreInstitucion(u.institucionId)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {new Date(u.created_at).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              u.rol === "admin"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {u.rol === "admin" ? "Administrador" : "Usuario"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => handleResetPassword(u.username)}
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-semibold"
                          >
                            Reiniciar Contraseña
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
