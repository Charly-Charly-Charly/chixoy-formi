"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

interface Usuario {
  id: number
  username: string
  nombre: string
  created_at: string
  institucionId?: number
}

interface Institucion {
  id: number
  nombre: string
}

export default function AdminPanel() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
    institucionId: "",
  })
  const [loading, setLoading] = useState(false)
  const [generatedSQL, setGeneratedSQL] = useState("")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [activeTab, setActiveTab] = useState<"crear" | "usuarios">("crear")
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loadingInstituciones, setLoadingInstituciones] = useState(true)

  useEffect(() => {
    cargarInstituciones()
    cargarUsuarios()
  }, [])

  const cargarInstituciones = async () => {
    try {
      const res = await fetch("/api/instituciones")
      const data = await res.json()

      if (Array.isArray(data)) {
        setInstituciones(data)
      }
    } catch (error) {
      console.error("Error cargando instituciones:", error)
    } finally {
      setLoadingInstituciones(false)
    }
  }

  const cargarUsuarios = async () => {
    try {
      const res = await fetch("/api/auth/get-users")
      const data = await res.json()

      if (res.ok) {
        setUsuarios(data.data)
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error)
    } finally {
      setLoadingUsuarios(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setGeneratedSQL("")

    try {
      if (!formData.institucionId) {
        throw new Error("Debe seleccionar una institución")
      }

      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          institucionId: Number.parseInt(formData.institucionId),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al crear usuario")
      }

      setGeneratedSQL(data.data.sqlQuery)

      await Swal.fire({
        title: "Usuario Creado",
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Usuario:</strong> ${data.data.username}</p>
            <p class="mb-2"><strong>Nombre:</strong> ${data.data.nombre}</p>
            <p class="mb-4 text-sm text-gray-600">Ejecuta el siguiente SQL en tu base de datos:</p>
            <div class="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
              ${data.data.sqlQuery}
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
      })

      setFormData({ username: "", password: "", nombre: "", institucionId: "" })
      cargarUsuarios()
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "Cerrar",
      })
    } finally {
      setLoading(false)
    }
  }

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
        if (!value) {
          return "La contraseña es requerida"
        }
        if (value.length < 6) {
          return "La contraseña debe tener al menos 6 caracteres"
        }
      },
    })

    if (!newPassword) return

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al reiniciar contraseña")
      }

      await Swal.fire({
        title: "Contraseña Reiniciada",
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Usuario:</strong> ${username}</p>
            <p class="mb-2"><strong>Nueva contraseña:</strong> ${newPassword}</p>
            <p class="mb-4 text-sm text-gray-600">Ejecuta el siguiente SQL en tu base de datos:</p>
            <div class="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
              ${data.data.sqlQuery}
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
      })
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "Cerrar",
      })
    }
  }

  const getNombreInstitucion = (institucionId?: number): string => {
    if (!institucionId) return "N/A"
    const inst = instituciones.find((i) => i.id === institucionId)
    return inst?.nombre || "N/A"
  }

  return (
    <div className="min-h-screen bg-[#202b52] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Volver al Inicio
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("crear")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "crear" ? "bg-blue-600 text-white" : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            Crear Usuario
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "usuarios" ? "bg-blue-600 text-white" : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            Gestionar Usuarios
          </button>
        </div>

        {activeTab === "crear" ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Crear Nuevo Usuario</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario (requerido)
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña (requerido)
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo (opcional)
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>

              <div>
                <label htmlFor="institucionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Institución (requerido)
                </label>
                <select
                  id="institucionId"
                  value={formData.institucionId}
                  onChange={(e) => setFormData({ ...formData, institucionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  required
                >
                  <option value="">Selecciona una institución...</option>
                  {loadingInstituciones ? (
                    <option disabled>Cargando instituciones...</option>
                  ) : (
                    instituciones.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Generando..." : "Crear Usuario"}
              </button>
            </form>

            {generatedSQL && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 mb-2">SQL Generado:</h3>
                <div className="bg-white p-3 rounded border border-green-300 overflow-x-auto">
                  <code className="text-xs font-mono text-gray-800">{generatedSQL}</code>
                </div>
                <p className="text-xs text-green-700 mt-2">Copia y ejecuta este SQL en tu base de datos MySQL.</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Instrucciones:</h3>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Completa el formulario con los datos del nuevo usuario</li>
                <li>Selecciona la institución a la que pertenece</li>
                <li>Haz clic en "Crear Usuario" para generar el hash de la contraseña</li>
                <li>Copia el SQL generado y ejecútalo en tu base de datos MySQL</li>
                <li>El nuevo usuario solo verá proyectos de su institución</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Gestionar Usuarios</h2>

            {loadingUsuarios ? (
              <p className="text-center text-gray-600">Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
              <p className="text-center text-gray-600">No hay usuarios disponibles</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">ID</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Usuario</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Nombre</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Institución</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Fecha Creación</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{usuario.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 font-mono">{usuario.username}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{usuario.nombre}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {getNombreInstitucion(usuario.institucionId)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {new Date(usuario.created_at).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => handleResetPassword(usuario.username)}
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition text-xs font-semibold"
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
  )
}
