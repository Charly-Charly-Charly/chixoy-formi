"use client";

import React, { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";

// *****************************************************************
// 1. DEFINICIÓN DE TIPOS DE DATOS (Necesario para que el código funcione)
// *****************************************************************

// Tipo base para un registro individual (tal como viene de la API)
interface ApiRecord {
  institucion: string;
  cod: string;
  anio: number;
  proyecto: string;
  eje: string;
  medida: string;
  meta: number; // Asumimos que es un número
  cumplimiento: number; // Asumimos que es un número
  porcentaje_acciones_realizadas: number; // Asumimos que es un número
  aclaraciones: string;
  justificacion: string;
  finiquitoLink?: string;
  pei?: boolean;
  poa?: boolean;
  pom?: boolean;
  peiLink?: string;
  poaLink?: string;
  pomLink?: string;
  [key: string]: any;
}

// Estructura de un proyecto dentro de una institución normalizada
interface ProjectEntry {
  cod: string;
  proyecto: string;
  dataByYear: Record<string, ApiRecord | undefined>; // Puede ser un registro o undefined
}

// Estructura de una institución normalizada (antes de la conversión final)
interface NormalizedInstitution {
  name: string;
  projects: Record<string, ProjectEntry>;
  rowspan: number;
}

// El tipo final que devuelve useReportData (el valor 'projects' es un array)
interface FinalNormalizedInstitution
  extends Omit<NormalizedInstitution, "projects"> {
  projects: ProjectEntry[];
}

// *****************************************************************
// 2. HOOK PERSONALIZADO: useReportData
// *****************************************************************

const YEARS = Array.from({ length: 2025 - 2015 + 1 }, (_, i) => 2015 + i);

const useReportData = (
  rawData: ApiRecord[],
  selectedInstitution: string | null
): FinalNormalizedInstitution[] => {
  return useMemo(() => {
    // 1. Filtrado de datos
    const filteredData = selectedInstitution
      ? rawData.filter((record) => record.institucion === selectedInstitution)
      : [];

    // 2. Inicialización del mapa de instituciones (Solo se inicializa aquí)
    const institutionsMap: Record<string, NormalizedInstitution> = {};

    filteredData.forEach((record) => {
      const { institucion, cod, anio } = record;

      // a. Inicializa la Institución si es la primera vez que la vemos
      if (!institutionsMap[institucion]) {
        institutionsMap[institucion] = {
          name: institucion,
          projects: {},
          rowspan: 0,
        };
      }

      const institutionEntry = institutionsMap[institucion];

      // b. Inicializa el Proyecto si es la primera vez que lo vemos
      if (!institutionEntry.projects[cod]) {
        institutionEntry.projects[cod] = {
          cod: cod,
          proyecto: record.proyecto,
          dataByYear: {},
        };
        institutionEntry.rowspan++;
      }

      // c. Asigna el registro al año correspondiente
      institutionEntry.projects[cod].dataByYear[String(anio)] = record;
    });

    // 3. Normalización final (convierte el objeto institutionsMap a un array FinalNormalizedInstitution[])
    const normalizedData = Object.values(institutionsMap).map((inst) => ({
      ...inst,
      projects: Object.values(inst.projects),
    })) as FinalNormalizedInstitution[];

    return normalizedData;
  }, [rawData, selectedInstitution]);
};

// *****************************************************************
// 3. FUNCIÓN DE GENERACIÓN DE PDF ESTILIZADA
// *****************************************************************

const generatePDF = (data: ApiRecord) => {
  const porcentaje = data.porcentaje_acciones_realizadas || 0;

  const content = document.createElement("div");
  content.id = "pdf-content-container";
  content.style.width = "210mm";
  content.style.padding = "15mm";
  content.style.backgroundColor = "#ffffff";
  content.style.fontFamily = "Arial, sans-serif";
  content.style.boxSizing = "border-box";
  content.style.lineHeight = "1.4";
  content.style.fontSize = "12pt";

  const headerColor = "#004c99";
  const accentColor = "#e0e7ff";

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Contenido HTML estilizado (usa 'data' correctamente tipado)
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
                RESULTADOS ANUALES (${data.anio})
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
                          porcentaje < 100 ? "#cc0000" : "#008000"
                        }; border: 1px solid #ddd;">${porcentaje}%</td>
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
            <p style="font-weight: bold; margin-bottom: 5px; color: #333; font-size: 14px;">Justificación:</p>
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

  document.body.appendChild(content);

  html2canvas(content, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const doc = new jsPDF("p", "mm", "a4");

    const docHeight = doc.internal.pageSize.getHeight();
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= docHeight;

    while (heightLeft > -5) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= docHeight;
    }

    doc.save(`Reporte_Cumplimiento_${data.cod}_${data.anio}.pdf`);

    document.body.removeChild(content);
  });
};

// *****************************************************************
// 4. COMPONENTES REACT
// *****************************************************************

interface DetailsModalProps {
  record: ApiRecord | null;
  onClose: () => void;
}

const DetailsModal = ({ record, onClose }: DetailsModalProps) => {
  if (!record) return null;

  const handleDownloadPDF = () => {
    generatePDF(record);
    const Toast = Swal.mixin({
      toast: true,
      position: "bottom",
      iconColor: "white",

      customClass: {
        popup: "colored-toast",
      },
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: "success",
      title: "¡PDF GENERADO Y DESCARGANDO!",
    });
  };

  const renderLink = (url: string | undefined, text: string) => {
    if (!url) return <span className="text-gray-500">N/A</span>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline transition duration-150"
      >
        {text}
      </a>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all p-6">
        <div className="flex justify-between items-start border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-indigo-700">
            Detalles del Reporte: {record.cod} - {record.anio}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-600 md:text-base">
          <p>
            <strong>Proyecto:</strong>{" "}
            <span className="font-medium">{record.proyecto}</span>
          </p>
          <p>
            <strong>Institución:</strong>{" "}
            <span className="font-medium">{record.institucion}</span>
          </p>
          <p>
            <strong>Medida / Eje:</strong>{" "}
            <span className="font-medium">
              {record.medida} / {record.eje}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <p>
              <strong>Meta:</strong>{" "}
              <span className="font-medium text-green-700">{record.meta}</span>
            </p>
            <p>
              <strong>% Realizado:</strong>{" "}
              <span className="font-medium text-green-700">
                {record.porcentaje_acciones_realizadas}%
              </span>
            </p>
            <p>
              <strong>Cumplimiento:</strong>{" "}
              <span className="font-medium">{record.cumplimiento}%</span>
            </p>
            <p>
              <strong>Finiquito:</strong>{" "}
              {renderLink(record.finiquitoLink, "Ver Finiquito")}
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2 text-indigo-600">
              Documentos de Planificación
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <p>
                <strong>PEI ({record.pei ? "Sí" : "No"}):</strong>{" "}
                {renderLink(record.peiLink, "Ver PEI")}
              </p>
              <p>
                <strong>POA ({record.poa ? "Sí" : "No"}):</strong>{" "}
                {renderLink(record.poaLink, "Ver POA")}
              </p>
              <p>
                <strong>POM ({record.pom ? "Sí" : "No"}):</strong>{" "}
                {renderLink(record.pomLink, "Ver POM")}
              </p>
            </div>
          </div>

          <p>
            <strong>Aclaraciones:</strong>{" "}
            <span className="italic">
              {record.aclaraciones || "No hay aclaraciones."}
            </span>
          </p>
          <p>
            <strong>Justificación:</strong>{" "}
            <span className="italic">
              {record.justificacion || "No hay justificación."}
            </span>
          </p>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={handleDownloadPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-300 shadow-md flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Descargar Reporte PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// *****************************************************************
// 5. COMPONENTE PRINCIPAL
// *****************************************************************

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ApiRecord[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<ApiRecord | null>(null);

  const uniqueInstitutions = useMemo<string[]>(() => {
    if (!Array.isArray(reportes)) return [];
    const names = [...new Set(reportes.map((r) => r.institucion))].sort();
    return names;
  }, [reportes]);

  const normalizedData = useReportData(reportes, selectedInstitution);

  // LÓGICA DE FETCH DE DATOS DESDE LA API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reportes/all");

        if (!res.ok) {
          throw new Error(`Failed to fetch reports. Status: ${res.status}`);
        }

        const data: ApiRecord[] = await res.json();

        setReportes(data);

        if (data.length > 0) {
          const firstInstitution = data[0].institucion;
          setSelectedInstitution(firstInstitution);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred during fetch.";
        setError(errorMessage);
        console.error("Error al cargar los reportes:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleCellClick = (record: ApiRecord | undefined) => {
    if (record) {
      setSelectedRecord(record);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-600">
          Cargando datos de reportes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 bg-red-100 min-h-screen font-sans text-center">
        <p className="text-red-700 font-semibold text-xl">
          Error al cargar datos:
        </p>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Si no hay datos, 'normalizedData' es un array vacío. Debemos asegurarnos de manejarlo.
  const selectedInstitutionData = normalizedData[0];

  // Aseguramos que 'projects' se lea correctamente del objeto o sea un array vacío
  const projects: ProjectEntry[] = selectedInstitutionData
    ? selectedInstitutionData.projects
    : [];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 border-b pb-2">
        Reporte de Cumplimiento Institucional (2015-2025)
      </h1>

      {/* Selector de Institución */}
      <div className="mb-8 p-4 bg-white rounded-xl shadow-md border border-indigo-200">
        <label
          htmlFor="institution-select"
          className="block text-lg font-medium text-indigo-700 mb-2"
        >
          Seleccione una Institución para ver el Reporte Anual:
        </label>
        <select
          id="institution-select"
          value={selectedInstitution}
          onChange={(e) => setSelectedInstitution(e.target.value)}
          className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 text-gray-700 bg-white"
        >
          <option value="" disabled>
            -- Elija una Institución --
          </option>
          {uniqueInstitutions.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Reportes */}
      {selectedInstitution ? (
        <div className="shadow-lg rounded-xl overflow-x-auto bg-white">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-white uppercase bg-indigo-700 sticky top-0">
              <tr>
                <th scope="col" className="p-3 text-center w-[100px]">
                  Institución
                </th>
                <th scope="col" className="p-3">
                  Proyecto (COD)
                </th>
                {YEARS.map((year) => (
                  <th
                    key={year}
                    scope="col"
                    className="p-3 text-center min-w-[70px] border-l border-indigo-600"
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={YEARS.length + 2}
                    className="py-6 text-center text-gray-500 bg-gray-50"
                  >
                    No se encontraron proyectos para la institución seleccionada
                    en este rango de años.
                  </td>
                </tr>
              ) : (
                projects.map((project, projIndex) => {
                  const isFirstInstitutionRow = projIndex === 0;

                  return (
                    <tr
                      key={`${project.cod}`}
                      className="border-b hover:bg-indigo-50 transition duration-150"
                    >
                      {isFirstInstitutionRow && selectedInstitutionData && (
                        <th
                          rowSpan={selectedInstitutionData.rowspan}
                          scope="row"
                          className="p-3 text-center align-top font-bold text-gray-900 bg-indigo-100/50 whitespace-nowrap border-r border-indigo-200"
                        >
                          {selectedInstitutionData.name}
                        </th>
                      )}

                      <td className="p-3 font-medium text-gray-700">
                        <span className="text-xs font-semibold text-indigo-600 block">
                          {project.cod}
                        </span>
                        {project.proyecto}
                      </td>

                      {YEARS.map((year) => {
                        // Accedemos a la dataByYear usando el año como string
                        const record = project.dataByYear[String(year)];
                        const hasData = !!record;
                        const cellClasses = hasData
                          ? "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition duration-150 transform hover:scale-105"
                          : "bg-gray-50 text-gray-400";

                        return (
                          <td
                            key={`${project.cod}-${year}`}
                            className={`p-3 text-center font-bold border-l border-gray-200 ${cellClasses}`}
                            onClick={() => handleCellClick(record)}
                          >
                            {hasData ? (
                              <div className="flex flex-col items-center justify-center">
                                <span title="Haga clic para ver detalles">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mx-auto"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                                <span className="text-xs mt-1">Reg.</span>
                              </div>
                            ) : (
                              <div className="text-xs">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 mx-auto text-gray-300"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                No
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl shadow-lg">
          <p className="text-xl text-gray-600 font-semibold">
            Por favor, utiliza el selector de arriba para elegir una Institución
            y ver su reporte anual detallado.
          </p>
        </div>
      )}

      {/* Renderizar el Modal si hay un registro seleccionado */}
      <DetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
