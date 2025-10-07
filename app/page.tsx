"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// Asegúrate de tener estas librerías instaladas:
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// -------------------------------------------------------------
// ## COMPONENTES DE VISTA Y UTILIDADES
// -------------------------------------------------------------

/**
 * Componente para la línea de firma (solo visual en el formulario).
 */
// const SignatureLine = () => (
//   <div className="flex flex-col items-center mt-8">
//     <div className="border-t border-gray-400 w-64 my-2"></div>
//     <span className="text-sm text-gray-600">Firma</span>
//   </div>
// );

const MySwal = withReactContent(Swal);

// -------------------------------------------------------------
// ## TIPOS DE DATOS (INTERFACES)
// -------------------------------------------------------------

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
  aclaraciones: string;
  justificacion: string;
  poaLink: string;
  peiLink: string;
  pomLink: string;
  finiquitoLink: string;
  porcentaje_acciones_realizadas: number;
  anio: number;
}

type ViewState = "selection" | "form";

// -------------------------------------------------------------
// ## FUNCIÓN DE GENERACIÓN DE PDF ESTILIZADA
// -------------------------------------------------------------

/**
 * Genera y descarga un PDF estilizado a partir de los datos del reporte.
 * Utiliza html2canvas para renderizar HTML con estilos en un canvas,
 * y jspdf para convertir el canvas en un documento PDF.
 * @param data Datos completos del reporte y proyecto.
 */
const generatePDF = (data: any) => {
  // Crear un contenedor temporal para el contenido del PDF
  const content = document.createElement("div");
  content.id = "pdf-content-container";
  content.style.width = "210mm"; // Ancho A4
  content.style.padding = "15mm";
  content.style.backgroundColor = "#ffffff";
  content.style.fontFamily = "Arial, sans-serif";
  content.style.boxSizing = "border-box";
  content.style.lineHeight = "1.4";

  // Estilos de utilidad
  const headerColor = "#004c99"; // Azul corporativo
  const accentColor = "#e0e7ff"; // Azul claro para fondo

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Contenido HTML estilizado
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
            <tr><td style="padding: 8px; width: 30%; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Institución:</td><td style="padding: 8px; border: 1px solid #ddd;">${
    data.institucion
  }</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Proyecto:</td><td style="padding: 8px; border: 1px solid #ddd;">${
    data.proyecto
  } (${data.cod})</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Eje y Medida:</td><td style="padding: 8px; border: 1px solid #ddd;">${
    data.eje
  } - ${data.medida}</td></tr>
      <tr><td style="padding: 8px; width: 30%; font-weight: bold; background-color: ${accentColor}; border: 1px solid #ddd;">Año:</td><td style="padding: 8px; border: 1px solid #ddd;">${
    data.anio
  }</td></tr>
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
        
        <div style="display: flex; justify-content: space-around; width: 100%; margin-top: 50px; text-align: center;">
            <div style="width: 45%; border-top: 1px solid #000; padding-top: 5px;">
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

  // 1. Añadir el contenido al cuerpo del documento (invisible para el usuario)
  document.body.appendChild(content);

  // 2. Usar html2canvas para capturar el HTML
  html2canvas(content, { scale: 2 }).then((canvas) => {
    const ImageData = canvas.toDataURL("image/png");
    const doc = new jsPDF("p", "mm", "a4");

    // Dimensiones A4 en mm
    const docHeight = doc.internal.pageSize.getHeight();
    const ImageWidth = 210;
    const ImageHeight = (canvas.height * ImageWidth) / canvas.width;
    let heightLeft = ImageHeight;
    let position = 0;

    // Primer página
    doc.addImage(ImageData, "PNG", 0, position, ImageWidth, ImageHeight);
    heightLeft -= docHeight;

    // Si hay más contenido (manejo de multi-página)
    while (heightLeft > -5) {
      // Usamos -5 como margen de error
      position = heightLeft - ImageHeight;
      doc.addPage();
      doc.addImage(ImageData, "PNG", 0, position, ImageWidth, ImageHeight);
      heightLeft -= docHeight;
    }

    // 3. Descargar el PDF
    doc.save(`Reporte_Cumplimiento_${data.cod}.pdf`);

    // 4. Limpiar el DOM
    document.body.removeChild(content);
  });
};

// -------------------------------------------------------------
// ## COMPONENTE PRINCIPAL: HOME
// -------------------------------------------------------------

export default function Home() {
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
  const [view, setView] = useState<ViewState>("selection");
  const [registroAnios, setRegistroAnios] = useState<number[]>([]);
  const [introLoading, setIntroLoading] = useState(true);

  // --- EFECTOS (useEffect) ---

  // Efecto para cargar instituciones al montar
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

  // Efecto para la pantalla de carga inicial (introLoading)
  useEffect(() => {
    const timer = setTimeout(() => setIntroLoading(false), 3000); // 3 segundos
    return () => clearTimeout(timer);
  }, []);

  // --- FUNCIONES ASÍNCRONAS ---

  const fetchProyectos = async (institucionId: number) => {
    try {
      const res = await fetch(`/api/proyectos?institucionId=${institucionId}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProyectos(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // --- MANEJADORES DE ESTADO Y VISTA ---

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
        ? "⚠️ Este proyecto ya tiene un reporte registrado." // solo advertencia
        : ""
    );

    // TODO: Traer todos los años ya registrados para este proyecto (Implementación pendiente en el código original)

    setFormData((prevData) => ({
      ...prevData,
      cumplimiento: 0,
      porcentaje_acciones_realizadas: 0,
      anio: 0, // reset del año
    }));
    setCumplimientoValue(0);
    setView("form");
  };

  const handleBack = () => {
    setSelectedProyecto(null);
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
    setView("selection");
  };

  // --- MANEJADOR DE CAMBIOS EN EL FORMULARIO ---

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
        [`${name}Link`]: checked
          ? prevData[`${name}Link` as keyof FormData]
          : "",
      }));
    } else if (name === "cumplimiento" && selectedProyecto) {
      const newCumplimiento = parseFloat(value || "0");
      let calculatedPorcentaje = 0;
      if (selectedProyecto.meta > 0) {
        calculatedPorcentaje = (newCumplimiento / selectedProyecto.meta) * 100;
      }
      setCumplimientoValue(newCumplimiento);
      setFormData((prevData) => ({
        ...prevData,
        cumplimiento: newCumplimiento,
        porcentaje_acciones_realizadas: parseFloat(
          calculatedPorcentaje.toFixed(2)
        ),
      }));
    } else if (name === "anio") {
      const anioValue = parseInt(value || "0");
      if (registroAnios.includes(anioValue)) {
        setMessage(`⚠️ Ya existe un reporte para el año ${anioValue}.`);
      } else {
        setMessage("");
      }
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

  // --- MANEJADOR DE ENVÍO (SUBMIT) ---

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!selectedProyecto) {
      setMessage("Por favor, selecciona un proyecto.");
      setLoading(false);
      return;
    }

    // Validación: cumplimiento 0 requiere justificación
    if (cumplimientoValue === 0 && !formData.justificacion) {
      setMessage("La justificación es obligatoria si el cumplimiento es 0.");
      setLoading(false);
      return;
    }

    // Validación: documentos seleccionados requieren link
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

    // Validación: año
    if (formData.anio < 2015 || formData.anio > 2026) {
      setMessage("Por favor, ingresa un año válido entre 2015 y 2026.");
      setLoading(false);
      return;
    }

    // Validación: año ya registrado (si la lista `registroAnios` ya se pobló)
    if (registroAnios.includes(formData.anio)) {
      setMessage(`Ya existe un reporte para el año ${formData.anio}.`);
      setLoading(false);
      return;
    }

    try {
      const reportData = {
        proyectoId: selectedProyecto.id,
        cumplimiento: parseFloat(String(formData.cumplimiento)),
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

      // Actualizar lista de años registrados
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

      // SweetAlert con recarga y descarga PDF
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

  // --- RENDERIZADO DE CARGA INICIAL ---

  if (introLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#202b52]">
        <div className="flex flex-col items-center">
          <Image
            src="/logo-copadeh.png" // cambia esta ruta a tu imagen
            alt="Cargando..."
            width={300}
          />
          <p className="mt-4 text-white font-semibold text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---

  return (
    <div className="min-h-screen bg-[#202b52] p-8">
      <main className="max-w-6xl mx-auto p-8 bg-[#202b52] h-[90vh] overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Reporte de Cumplimiento
        </h1>

        {view === "selection" && (
          <div className="flex gap-6">
            <div className="w-[30%] h-[70vh] p-8 bg-white shadow-md rounded-lg overflow-y-scroll">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Selecciona una Institución:
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {instituciones.map((inst) => (
                      <tr
                        key={inst.id}
                        onClick={() => handleInstitucionSelect(inst)}
                        className={`cursor-pointer hover:bg-gray-100 ${
                          selectedInstitucion?.id === inst.id
                            ? "bg-blue-600 text-white"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {inst.nombre}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="w-[70%] h-[70vh] p-8 bg-white shadow-md rounded-lg overflow-y-scroll">
              {selectedInstitucion && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    Selecciona un Proyecto de {selectedInstitucion.nombre}:
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[65%]">
                            Nombre
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {proyectos.map((proy) => (
                          <tr
                            key={proy.id}
                            onClick={() => handleProyectoSelect(proy)}
                            className={`cursor-pointer hover:bg-gray-100 ${
                              selectedProyecto?.id === proy.id
                                ? "bg-blue-100"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 w-[65%] break-words">
                              {proy.nombre}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "form" && selectedProyecto && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
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
                <span className="font-semibold text-white">Regresar</span>
              </button>
            </div>

            <h2 className="text-2xl font-semibold mb-4 text-white">
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
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="poa"
                      name="poa"
                      checked={formData.poa}
                      onChange={handleFormChange}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor="poa" className="text-gray-700 ml-2">
                      POA
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pei"
                      name="pei"
                      checked={formData.pei}
                      onChange={handleFormChange}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor="pei" className="text-gray-700 ml-2">
                      PEI
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pom"
                      name="pom"
                      checked={formData.pom}
                      onChange={handleFormChange}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor="pom" className="text-gray-700 ml-2">
                      POM
                    </label>
                  </div>
                </div>

                {formData.poa && (
                  <div>
                    <label htmlFor="poaLink" className="block text-gray-700">
                      Enlace a documento POA:
                    </label>
                    <input
                      type="url"
                      id="poaLink"
                      name="poaLink"
                      value={formData.poaLink}
                      onChange={handleFormChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                )}
                {formData.pei && (
                  <div>
                    <label htmlFor="peiLink" className="block text-gray-700">
                      Enlace a documento PEI:
                    </label>
                    <input
                      type="url"
                      id="peiLink"
                      name="peiLink"
                      value={formData.peiLink}
                      onChange={handleFormChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                )}
                {formData.pom && (
                  <div>
                    <label htmlFor="pomLink" className="block text-gray-700">
                      Enlace a documento POM:
                    </label>
                    <input
                      type="url"
                      id="pomLink"
                      name="pomLink"
                      value={formData.pomLink}
                      onChange={handleFormChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                )}
                <div className="flex flex-row gap-5">
                  <div className="w-[45%]">
                    <label
                      htmlFor="cumplimiento"
                      className="block text-gray-700"
                    >
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
                  <div className="w-[45%]">
                    <label htmlFor="anio" className="block text-gray-700">
                      Año:
                    </label>
                    <input
                      type="number"
                      id="anio"
                      name="anio"
                      value={formData.anio}
                      onChange={handleFormChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="porcentaje" className="block text-gray-700">
                    Porcentaje de Acciones Realizadas:
                  </label>
                  <input
                    type="text"
                    id="porcentaje"
                    value={
                      formData.porcentaje_acciones_realizadas.toFixed(2) + "%"
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
                  <label
                    htmlFor="finiquitoLink"
                    className="block text-gray-700"
                  >
                    Enlace a Finiquito:
                  </label>
                  <input
                    type="url"
                    id="finiquitoLink"
                    name="finiquitoLink"
                    value={formData.finiquitoLink}
                    onChange={handleFormChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-sky-900 font-bold py-3 px-6 rounded-md hover:bg-blue-300 transition duration-300 disabled:opacity-50"
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
