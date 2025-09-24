"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";

interface Institucion {
  id: number;
  nombre: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  cod: string;
  medida: string;
  eje: string;
  meta: number;
  reporte_id: number | null;
}

interface FormData {
  poa: boolean;
  pei: boolean;
  pom: boolean;
  cumplimiento: number;
  finiquito: File | null;
  aclaraciones: string; // Nuevo campo
  justificacion: string; // Nuevo campo
}

export default function Home() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [selectedInstitucionId, setSelectedInstitucionId] =
    useState<string>("");
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string>("");
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    poa: false,
    pei: false,
    pom: false,
    cumplimiento: 0,
    finiquito: null,
    aclaraciones: "",
    justificacion: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [cumplimientoValue, setCumplimientoValue] = useState<number>(0);

  useEffect(() => {
    const fetchInstituciones = async () => {
      try {
        const res = await fetch("/api/instituciones");
        if (!res.ok) throw new Error("Failed to fetch institutions");
        const data = await res.json();
        setInstituciones(data);
      } catch (error) {
        console.error("Error fetching institutions:", error);
      }
    };
    fetchInstituciones();
  }, []);

  const handleInstitucionChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedInstitucionId(id);
    setSelectedProyectoId("");
    setSelectedProyecto(null);
    setProyectos([]);
    setMessage("");
    if (id) {
      try {
        const res = await fetch(`/api/proyectos?institucionId=${id}`);
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProyectos(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
  };

  const handleProyectoChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProyectoId(id);
    const proyecto = proyectos.find((p) => p.id === parseInt(id));
    if (proyecto) {
      setSelectedProyecto(proyecto);
      setMessage(
        proyecto.reporte_id
          ? "⚠️ Este proyecto ya tiene un reporte registrado."
          : ""
      );
    } else {
      setSelectedProyecto(null);
      setMessage("");
    }
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "cumplimiento") {
      setCumplimientoValue(parseFloat(value));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prevData) => ({
      ...prevData,
      finiquito: file,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!selectedProyecto) {
      setMessage("Por favor, selecciona un proyecto.");
      setLoading(false);
      return;
    }

    if (selectedProyecto.reporte_id) {
      setMessage(
        "No se puede crear un nuevo reporte. Este proyecto ya tiene un registro."
      );
      setLoading(false);
      return;
    }

    if (cumplimientoValue === 0 && !formData.justificacion) {
      setMessage("La justificación es obligatoria si el cumplimiento es 0.");
      setLoading(false);
      return;
    }

    try {
      let finiquitoPath = null;
      if (formData.finiquito) {
        const uploadData = new FormData();
        uploadData.append("finiquito", formData.finiquito);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload PDF");
        const uploadResult = await uploadRes.json();
        finiquitoPath = uploadResult.filePath;
      }

      const reportRes = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyectoId: selectedProyecto.id,
          cumplimiento: parseFloat(String(formData.cumplimiento)),
          poa: formData.poa,
          pei: formData.pei,
          pom: formData.pom,
          finiquito_path: finiquitoPath,
          aclaraciones: formData.aclaraciones,
          justificacion: formData.justificacion,
        }),
      });

      if (!reportRes.ok) throw new Error("Failed to save report");
      setMessage("Reporte generado con éxito!");
      setFormData({
        poa: false,
        pei: false,
        pom: false,
        cumplimiento: 0,
        finiquito: null,
        aclaraciones: "",
        justificacion: "",
      });
      setSelectedProyecto(null);
      setSelectedProyectoId("");
      if (selectedInstitucionId) {
        const res = await fetch(
          `/api/proyectos?institucionId=${selectedInstitucionId}`
        );
        const data = await res.json();
        setProyectos(data);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-800 p-8 ">
      <main className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          INFORME DE EJECUCIÓN CHIXOY
        </h1>

        <div className="space-y-6">
          <div className="mb-4">
            <label
              htmlFor="institucion"
              className="block text-gray-700 font-bold mb-2"
            >
              Selecciona tu Institución:
            </label>
            <select
              id="institucion"
              value={selectedInstitucionId}
              onChange={handleInstitucionChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">-- Selecciona una institución --</option>
              {instituciones.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nombre}
                </option>
              ))}
            </select>
          </div>

          {proyectos.length > 0 && (
            <div className="mb-4">
              <label
                htmlFor="proyecto"
                className="block text-gray-700 font-bold mb-2"
              >
                Selecciona un Proyecto:
              </label>
              <select
                id="proyecto"
                value={selectedProyectoId}
                onChange={handleProyectoChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="">-- Selecciona un proyecto --</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}{" "}
                    {proyecto.reporte_id && " (Ya tiene reporte)"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedProyecto && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Datos del Proyecto: {selectedProyecto.nombre}
            </h2>
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="font-semibold text-gray-600">Código:</span>{" "}
                  {selectedProyecto.cod}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Medida:</span>{" "}
                  {selectedProyecto.medida}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Eje:</span>{" "}
                  {selectedProyecto.eje}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Meta:</span>{" "}
                  {selectedProyecto.meta}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id="poa"
                    name="poa"
                    checked={formData.poa}
                    onChange={handleFormChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label htmlFor="poa" className="text-gray-700">
                    POA
                  </label>
                  <input
                    type="checkbox"
                    id="pei"
                    name="pei"
                    checked={formData.pei}
                    onChange={handleFormChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label htmlFor="pei" className="text-gray-700">
                    PEI
                  </label>
                  <input
                    type="checkbox"
                    id="pom"
                    name="pom"
                    checked={formData.pom}
                    onChange={handleFormChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label htmlFor="pom" className="text-gray-700">
                    POM
                  </label>
                </div>
                <div>
                  <label htmlFor="cumplimiento" className="block text-gray-700">
                    Cumplimiento de Acciones (X):
                  </label>
                  <input
                    type="number"
                    id="cumplimiento"
                    name="cumplimiento"
                    value={formData.cumplimiento}
                    onChange={handleFormChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="porcentaje" className="block text-gray-700">
                    Porcentaje de Acciones Realizadas:
                  </label>
                  <input
                    type="text"
                    id="porcentaje"
                    value={
                      (
                        ((formData.cumplimiento || 0) / selectedProyecto.meta) *
                        100
                      ).toFixed(2) + "%"
                    }
                    readOnly
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-200"
                  />
                </div>
                <div>
                  <label htmlFor="aclaraciones" className="block text-gray-700">
                    Aclaraciones:
                  </label>
                  <textarea
                    id="aclaraciones"
                    name="aclaraciones"
                    value={formData.aclaraciones}
                    onChange={handleFormChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {cumplimientoValue === 0 && (
                  <div>
                    <label
                      htmlFor="justificacion"
                      className="block text-gray-700"
                    >
                      Justificación (obligatorio si el cumplimiento es 0):
                    </label>
                    <textarea
                      id="justificacion"
                      name="justificacion"
                      value={formData.justificacion}
                      onChange={handleFormChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="finiquito" className="block text-gray-700">
                    Finiquito (PDF):
                  </label>
                  <input
                    type="file"
                    id="finiquito"
                    name="finiquito"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="mt-1 w-full text-gray-700"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!selectedProyecto.reporte_id}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Generando..." : "Generar Reporte"}
            </button>
            {message && (
              <p
                className={`mt-4 text-center font-semibold ${
                  message.startsWith("⚠️")
                    ? "text-orange-500"
                    : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
