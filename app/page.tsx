"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

interface Reporte {
  anio: number;
}

interface FormData {
  poa: boolean;
  pei: boolean;
  pom: boolean;
  cumplimiento: number;
  aclaraciones: string;
  justificacion: string;
  poaLink: string;
  peiLink: string;
  pomLink: string;
  finiquitoLink: string;
  porcentaje_acciones_realizadas: number;
  anio: number;
}

type ViewState = "institutions" | "projects" | "form";

// ============================================================================
// UTILITIES
// ============================================================================

const MySwal = withReactContent(Swal);

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ============================================================================
// PDF GENERATION
// ============================================================================

const generatePDF = (data: any) => {
  const content = document.createElement("div");
  content.id = "pdf-content-container";
  content.style.width = "210mm";
  content.style.padding = "15mm";
  content.style.backgroundColor = "#ffffff";
  content.style.fontFamily = "Arial, sans-serif";
  content.style.boxSizing = "border-box";
  content.style.lineHeight = "1.4";

  const headerColor = "#004c99";
  const accentColor = "#e0e7ff";

  content.innerHTML = `
    <div style="border: 2px solid ${headerColor}; padding: 15px; border-radius: 8px;">
      <div style="text-align: center; background-color: ${headerColor}; color: white; padding: 15px; border-radius: 5px 5px 0 0; margin: -15px -15px 15px -15px;">
        <h1 style="margin: 0; font-size: 24px;">REPORTE DE CUMPLIMIENTO DE PROYECTO</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Generado el: ${formatDate()}</p>
      </div>

      <h2 style="font-size: 18px; color: ${headerColor}; border-bottom: 2px solid ${accentColor}; padding-bottom: 5px; margin-top: 20px;">
        INFORMACIÓN GENERAL
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 8px; width: 30%; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Institución:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${
            data.institucion
          }</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Proyecto:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.proyecto} (${
    data.cod
  })</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Eje y Medida:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.eje} - ${
    data.medida
  }</td>
        </tr>
        <tr>
          <td style="padding: 8px; width: 30%; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Año:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.anio}</td>
        </tr>
      </table>

      <h2 style="font-size: 18px; color: ${headerColor}; border-bottom: 2px solid ${accentColor}; padding-bottom: 5px; margin-top: 20px;">
        RESULTADOS
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <thead>
          <tr>
            <th style="padding: 8px; background-color: ${headerColor}; color: white; border: 1px solid #ddd;">Meta (Esperada)</th>
            <th style="padding: 8px; background-color: ${headerColor}; color: white; border: 1px solid #ddd;">Cumplimiento (Realizado)</th>
            <th style="padding: 8px; background-color: ${headerColor}; color: white; border: 1px solid #ddd;">Porcentaje %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${
              data.meta
            }</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${
              data.cumplimiento
            }</td>
            <td style="padding: 8px; text-align: center; font-weight: bold; color: ${
              data.porcentaje < 100 ? "#cc0000" : "#008000"
            }; border: 1px solid #ddd;">${data.porcentaje}%</td>
          </tr>
        </tbody>
      </table>

      <h2 style="font-size: 18px; color: ${headerColor}; border-bottom: 2px solid ${accentColor}; padding-bottom: 5px; margin-top: 20px;">
        DETALLES Y JUSTIFICACIÓN
      </h2>
      <p style="font-weight: bold; margin-bottom: 5px; color: #333; font-size: 14px;">Aclaraciones:</p>
      <div style="border: 1px solid #ccc; padding: 10px; min-height: 50px; margin-bottom: 15px; background-color: #fafafa; white-space: pre-wrap; font-size: 13px;">
        ${data.aclaraciones || "No se proporcionaron aclaraciones."}
      </div>
      <p style="font-weight: bold; margin-bottom: 5px; color: #333; font-size: 14px;">Justificación (Si Cumplimiento es 0):</p>
      <div style="border: 1px solid #ccc; padding: 10px; min-height: 50px; margin-bottom: 30px; background-color: #fafafa; white-space: pre-wrap; font-size: 13px;">
        ${data.justificacion || "No aplica."}
      </div>

      <h2 style="font-size: 18px; color: ${headerColor}; border-bottom: 2px solid ${accentColor}; padding-bottom: 5px; margin-top: 20px;">
        APROBACIÓN Y VALIDACIÓN
      </h2>
      
      <div style="display: flex; justify-content: space-around; width: 100%; margin-top: 50px; text-align: center; flex-wrap: wrap;">
        <div style="width: 45%; border-top: 1px solid #000; padding-top: 5px; margin-bottom: 20px;">
          <p style="font-size: 14px; margin: 0;">_________________________</p>
          <p style="font-size: 14px; margin: 0; font-weight: bold;">FIRMA DEL RESPONSABLE</p>
        </div>
        <div style="width: 45%;">
          <div style="border: 2px dashed #999; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; background-color: #fff;">
            <span style="color: #999; font-size: 12px;">ESPACIO PARA SELLO INSTITUCIONAL</span>
          </div>
          <p style="font-size: 14px; margin: 0; font-weight: bold;">SELLO</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(content);

  html2canvas(content, { scale: 2 }).then((canvas) => {
    const imageData = canvas.toDataURL("image/png");
    const doc = new jsPDF("p", "mm", "a4");

    const docHeight = doc.internal.pageSize.getHeight();
    const imageWidth = 210;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    let heightLeft = imageHeight;
    let position = 0;

    doc.addImage(imageData, "PNG", 0, position, imageWidth, imageHeight);
    heightLeft -= docHeight;

    while (heightLeft > -5) {
      position = heightLeft - imageHeight;
      doc.addPage();
      doc.addImage(imageData, "PNG", 0, position, imageWidth, imageHeight);
      heightLeft -= docHeight;
    }

    doc.save(`Reporte_Cumplimiento_${data.cod}.pdf`);
    document.body.removeChild(content);
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  // State Management
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [selectedInstitucion, setSelectedInstitucion] =
    useState<Institucion | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    poa: false,
    pei: false,
    pom: false,
    cumplimiento: 0,
    aclaraciones: "",
    justificacion: "",
    poaLink: "",
    peiLink: "",
    pomLink: "",
    finiquitoLink: "",
    porcentaje_acciones_realizadas: 0,
    anio: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [cumplimientoValue, setCumplimientoValue] = useState<number>(0);
  const [view, setView] = useState<ViewState>("institutions");
  const [registroAnios, setRegistroAnios] = useState<number[]>([]);
  const [introLoading, setIntroLoading] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load institutions on mount
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

  // Intro loading screen
  useEffect(() => {
    const timer = setTimeout(() => setIntroLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Load registered years when project is selected
  useEffect(() => {
    if (selectedProyecto) {
      const fetchReporteAnios = async (proyectoId: number) => {
        try {
          const res = await fetch(`/api/reportes?proyectoId=${proyectoId}`);
          if (!res.ok) throw new Error("Failed to fetch registered years");

          const aniosRegistrados: number[] = await res.json();

          console.log(
            "[v0] Años registrados para proyecto",
            proyectoId,
            ":",
            aniosRegistrados
          );
          setRegistroAnios(aniosRegistrados);

          const aniosDisponibles = generateAniosOptions(aniosRegistrados);
          const primerAnioDisponible =
            aniosDisponibles.length > 0 ? aniosDisponibles[0].value : 0;

          console.log(
            "[v0] Años disponibles después de filtrar:",
            aniosDisponibles.map((a) => a.value)
          );

          setFormData((prevData) => ({
            ...prevData,
            anio: primerAnioDisponible,
          }));
        } catch (error) {
          console.error("Error fetching registered years:", error);
          setRegistroAnios([]);
        }
      };

      fetchReporteAnios(selectedProyecto.id);
    }
  }, [selectedProyecto]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const fetchProyectos = async (institucionId: number) => {
    try {
      const res = await fetch(`/api/proyectos?institucionId=${institucionId}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProyectos(data);
      setView("projects");
    } catch (error) {
      console.error("Error fetching projects:", error);
      setMessage("Error al cargar proyectos. Intenta de nuevo.");
    }
  };

  const handleInstitucionSelect = (institucion: Institucion) => {
    setSelectedInstitucion(institucion);
    setSelectedProyecto(null);
    setProyectos([]);
    setMessage("");
    fetchProyectos(institucion.id);
  };

  const handleProyectoSelect = async (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    setMessage(
      proyecto.reporte_id
        ? "⚠️ Este proyecto ya tiene un reporte registrado."
        : ""
    );

    setFormData((prevData) => ({
      ...prevData,
      cumplimiento: 0,
      porcentaje_acciones_realizadas: 0,
      anio: 0,
    }));
    setCumplimientoValue(0);
    setView("form");
  };

  const handleBack = () => {
    if (view === "form") {
      setView("projects");
      setFormData({
        poa: false,
        pei: false,
        pom: false,
        cumplimiento: 0,
        aclaraciones: "",
        justificacion: "",
        poaLink: "",
        peiLink: "",
        pomLink: "",
        finiquitoLink: "",
        porcentaje_acciones_realizadas: 0,
        anio: 0,
      });
      setCumplimientoValue(0);
      setMessage("");
      setSelectedProyecto(null);
      setRegistroAnios([]);
    } else if (view === "projects") {
      setView("institutions");
      setSelectedInstitucion(null);
      setProyectos([]);
      setMessage("");
    }
  };

  const generateAniosOptions = (registrados: number[]) => {
    const startYear = 2015;
    const endYear = 2025;
    const anios: { value: number; label: string; registrado: boolean }[] = [];

    for (let anio = endYear; anio >= startYear; anio--) {
      const isRegistrado = registrados.includes(anio);
      if (!isRegistrado) {
        anios.push({
          value: anio,
          label: anio.toString(),
          registrado: false,
        });
      }
    }

    return anios;
  };

  const aniosDisponibles = generateAniosOptions(registroAnios);

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === "checkbox") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
        [`${name}Link`]: checked
          ? prevData[`${name}Link` as keyof FormData]
          : "",
      }));
    } else if (name === "cumplimiento" && selectedProyecto) {
      const newCumplimiento = Number.parseFloat(value || "0");
      let calculatedPorcentaje = 0;
      if (selectedProyecto.meta > 0) {
        calculatedPorcentaje = (newCumplimiento / selectedProyecto.meta) * 100;
      }
      setCumplimientoValue(newCumplimiento);
      setFormData((prevData) => ({
        ...prevData,
        cumplimiento: newCumplimiento,
        porcentaje_acciones_realizadas: Number.parseFloat(
          calculatedPorcentaje.toFixed(2)
        ),
      }));
    } else if (name === "anio") {
      const anioValue = Number.parseInt(value || "0");
      setFormData((prevData) => ({
        ...prevData,
        anio: anioValue,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
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

    if (
      formData.anio === 0 ||
      !aniosDisponibles.some((a) => a.value === formData.anio)
    ) {
      setMessage("Por favor, selecciona un año válido y no registrado.");
      setLoading(false);
      return;
    }

    if (cumplimientoValue === 0 && !formData.justificacion) {
      setMessage("La justificación es obligatoria si el cumplimiento es 0.");
      setLoading(false);
      return;
    }

    if (
      (formData.poa && !formData.poaLink) ||
      (formData.pei && !formData.peiLink) ||
      (formData.pom && !formData.pomLink)
    ) {
      setMessage(
        "Por favor, ingresa el enlace para cada documento que has seleccionado."
      );
      setLoading(false);
      return;
    }

    try {
      const reportData = {
        proyectoId: selectedProyecto.id,
        cumplimiento: Number.parseFloat(String(formData.cumplimiento)),
        porcentaje_acciones_realizadas: formData.porcentaje_acciones_realizadas,
        poaLink: formData.poa ? formData.poaLink || null : null,
        peiLink: formData.pei ? formData.peiLink || null : null,
        pomLink: formData.pom ? formData.pomLink || null : null,
        aclaraciones: formData.aclaraciones,
        justificacion: formData.justificacion,
        finiquitoLink: formData.finiquitoLink || null,
        poa: formData.poa,
        pei: formData.pei,
        pom: formData.pom,
        anio: formData.anio,
      };

      const reportRes = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (!reportRes.ok) {
        const errorData = await reportRes.json();
        throw new Error(errorData.message || "Failed to save report");
      }

      setRegistroAnios((prev) => [...prev, formData.anio]);

      const fullReportData = {
        institucion: selectedInstitucion?.nombre || "N/A",
        proyecto: selectedProyecto.nombre,
        cod: selectedProyecto.cod,
        medida: selectedProyecto.medida,
        eje: selectedProyecto.eje,
        meta: selectedProyecto.meta,
        cumplimiento: reportData.cumplimiento,
        porcentaje: reportData.porcentaje_acciones_realizadas.toFixed(2),
        aclaraciones: reportData.aclaraciones,
        justificacion: reportData.justificacion,
        anio: reportData.anio,
      };

      MySwal.fire({
        title: "¡Reporte enviado!",
        html: `El reporte del proyecto **${selectedProyecto.nombre}** ha sido enviado con éxito.`,
        icon: "success",
        confirmButtonText: "Aceptar y Recargar",
        showDenyButton: true,
        denyButtonText: "Descargar PDF",
        allowOutsideClick: false,
        preDeny: () => {
          generatePDF(fullReportData);
          Swal.close();
        },
        preConfirm: () => {
          window.location.reload();
        },
      });
    } catch (error: any) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (introLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#202b52] p-4">
        <div className="flex flex-col items-center">
          <Image
            src="/logo-copadeh.png"
            alt="Cargando..."
            height={150}
            width={300}
          />
          <p className="mt-4 text-white font-semibold text-base">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202b52] p-4">
      <main className="max-w-full mx-auto p-0 sm:p-4 bg-[#202b52]">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">
          Reporte de Cumplimiento
        </h1>

        {/* INSTITUTIONS VIEW */}
        {view === "institutions" && (
          <div className="p-4 bg-white shadow-md rounded-lg h-auto min-h-[80vh]">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Selecciona una Institución:
            </h2>
            <div className="overflow-y-auto max-h-[70vh]">
              {instituciones.length === 0 ? (
                <p className="text-gray-500 text-center py-5">
                  Cargando instituciones...
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {instituciones.map((inst) => (
                    <li
                      key={inst.id}
                      onClick={() => handleInstitucionSelect(inst)}
                      className={`cursor-pointer p-3 hover:bg-gray-100 transition duration-150 rounded-md ${
                        selectedInstitucion?.id === inst.id
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-900"
                      }`}
                    >
                      <span className="font-medium">{inst.nombre}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS VIEW */}
        {view === "projects" && selectedInstitucion && (
          <div className="p-4 bg-white shadow-md rounded-lg h-auto min-h-[80vh]">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H14a1 1 0 100-2H9.414l1.293-1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-sm">Instituciones</span>
              </button>
            </div>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Proyectos de: {selectedInstitucion.nombre}
            </h2>
            <div className="overflow-y-auto max-h-[70vh]">
              {proyectos.length === 0 ? (
                <p className="text-gray-500 text-center py-5">
                  No hay proyectos disponibles.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {proyectos.map((proy) => (
                    <li
                      key={proy.id}
                      onClick={() => handleProyectoSelect(proy)}
                      className={`cursor-pointer p-3 hover:bg-gray-100 transition duration-150 rounded-md ${
                        selectedProyecto?.id === proy.id
                          ? "bg-blue-100"
                          : "text-gray-900"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {proy.nombre}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Código: {proy.cod} | Meta: {proy.meta}
                        </span>
                        {proy.reporte_id && (
                          <span className="text-xs text-orange-500 font-semibold mt-1">
                            (⚠️ Reporte Existente)
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* FORM VIEW */}
        {view === "form" && selectedProyecto && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-white hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="white"
                  viewBox="0 0 24 24"
                  stroke="white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-medium">Proyectos</span>
              </button>
            </div>

            <h2 className="text-xl font-semibold mb-3 text-white">
              Reporte: {selectedProyecto.nombre}
            </h2>

            <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-4">
              {/* Project Information */}
              <div className="space-y-2 text-sm">
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-600">
                    Institución:
                  </span>{" "}
                  {selectedInstitucion?.nombre || "N/A"}
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-600">Código:</span>{" "}
                  {selectedProyecto.cod}
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-600">Meta:</span>{" "}
                  {selectedProyecto.meta}
                </div>
              </div>

              <hr />

              {/* Cumplimiento */}
              {selectedProyecto.meta > 0 && (
                <div>
                  <label
                    htmlFor="cumplimiento"
                    className="block text-gray-700 text-sm font-medium"
                  >
                    Cumplimiento de Acciones (X):
                  </label>
                  <input
                    type="number"
                    id="cumplimiento"
                    name="cumplimiento"
                    value={formData.cumplimiento}
                    onChange={handleFormChange}
                    className="mt-1 w-full p-2 border border-gray-300 text-gray-600 placeholder:text-gray-300 rounded-md text-base"
                    required
                  />
                </div>
              )}

              {/* Year Selection */}
              <div>
                <label
                  htmlFor="anio"
                  className="block text-gray-700 text-sm font-medium"
                >
                  Año:
                </label>
                <select
                  id="anio"
                  name="anio"
                  value={formData.anio}
                  onChange={handleFormChange}
                  className="mt-1 w-full p-2 border border-gray-300 text-gray-600 rounded-md text-base"
                  required
                >
                  {aniosDisponibles.length === 0 && (
                    <option value={0}>
                      Todos los años (2015-2025) ya están registrados
                    </option>
                  )}
                  {aniosDisponibles.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Registered Years Info */}
              {registroAnios.length > 0 && (
                <div className="text-sm text-gray-700 mt-2 p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <span className="font-semibold">
                        Años ya registrados para este proyecto:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {registroAnios
                          .sort((a, b) => b - a)
                          .map((anio) => (
                            <span
                              key={anio}
                              className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded"
                            >
                              {anio}
                            </span>
                          ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        Estos años no aparecen en el selector porque ya tienen
                        reportes registrados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <hr />

              {/* Percentage */}
              <div>
                <label
                  htmlFor="porcentaje"
                  className="block text-gray-700 text-sm font-medium"
                >
                  Porcentaje de Acciones Realizadas:
                </label>
                <input
                  type="text"
                  id="porcentaje"
                  value={
                    formData.porcentaje_acciones_realizadas.toFixed(2) + "%"
                  }
                  readOnly
                  className="mt-1 w-full p-2 border border-gray-300 text-gray-600 rounded-md bg-gray-200 font-bold text-lg text-center"
                />
              </div>

              <hr />

              {/* Documentation */}
              <p className="text-gray-700 text-sm font-medium mb-2">
                Documentación Adjunta (Marcar y agregar enlace):
              </p>
              <div className="space-y-3">
                {[
                  {
                    id: "poa",
                    label: "POA",
                    linkName: "poaLink" as keyof FormData,
                  },
                  {
                    id: "pei",
                    label: "PEI",
                    linkName: "peiLink" as keyof FormData,
                  },
                  {
                    id: "pom",
                    label: "POM",
                    linkName: "pomLink" as keyof FormData,
                  },
                ].map(({ id, label, linkName }) => (
                  <div key={id}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={id}
                        name={id}
                        checked={formData[id as keyof FormData] as boolean}
                        onChange={handleFormChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      />
                      <label
                        htmlFor={id}
                        className="text-gray-700 ml-2 font-medium"
                      >
                        {label}
                      </label>
                    </div>
                    {(formData[id as keyof FormData] as boolean) && (
                      <input
                        type="url"
                        name={linkName as string}
                        value={formData[linkName] as string}
                        onChange={handleFormChange}
                        placeholder={`Enlace a documento ${label}`}
                        className="mt-2 w-full p-2 border text-gray-600 border-gray-300 rounded-md text-sm"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>

              <hr />

              {/* Aclaraciones */}
              <div>
                <label
                  htmlFor="aclaraciones"
                  className="block text-gray-700 text-sm font-medium"
                >
                  Reporte:
                </label>
                <textarea
                  id="aclaraciones"
                  name="aclaraciones"
                  value={formData.aclaraciones}
                  onChange={handleFormChange}
                  rows={3}
                  className="mt-1 w-full p-2 border text-gray-600 border-gray-300 rounded-md text-base"
                  required
                />
              </div>

              {/* Justificación (conditional) */}
              {cumplimientoValue === 0 && (
                <div className="border border-red-300 p-3 rounded-md bg-red-50">
                  <label
                    htmlFor="justificacion"
                    className="block text-red-700 text-sm font-medium"
                  >
                    Justificación (obligatorio si el cumplimiento es 0):
                  </label>
                  <textarea
                    id="justificacion"
                    name="justificacion"
                    value={formData.justificacion}
                    onChange={handleFormChange}
                    rows={3}
                    className="mt-1 w-full p-2 border text-gray-600 border-gray-300 rounded-md text-base"
                    required
                  />
                </div>
              )}

              {/* Finiquito Link */}
              <div>
                <label
                  htmlFor="finiquitoLink"
                  className="block text-gray-700 text-sm font-medium"
                >
                  Enlace a Finiquito:
                </label>
                <input
                  type="url"
                  id="finiquitoLink"
                  name="finiquitoLink"
                  required
                  value={formData.finiquitoLink}
                  onChange={handleFormChange}
                  className="mt-1 w-full p-2 border border-gray-300 text-gray-600 rounded-md text-base"
                />
              </div>
            </div>

            {/* Error/Warning Message */}
            {message && (
              <p
                className={`mt-4 text-center font-semibold p-2 rounded ${
                  message.startsWith("⚠️")
                    ? "text-orange-500 bg-orange-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                {message}
              </p>
            )}

            {/* Submit Button */}
            <div className="text-center pb-8">
              <button
                type="submit"
                disabled={loading || aniosDisponibles.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
