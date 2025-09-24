"use client";

import { useState, useEffect, FC } from "react";

// Nuevo componente modal con título dinámico y altura fija
const Modal: FC<{
  show: boolean;
  onClose: () => void;
  content: string;
  title: string;
}> = ({ show, onClose, content, title }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-5 border w-1/2 h-[70vh] shadow-lg rounded-md bg-white flex flex-col">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
            {title}
          </h3>
        </div>
        <div className="mt-4 px-7 py-3 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 text-left">{content}</p>
        </div>
        <div className="items-center px-4 py-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal de la tabla
interface Reporte {
  proyecto: string;
  cod: string;
  institucion: string;
  medida: string;
  eje: string;
  cumplimiento: number;
  poa: boolean;
  pei: boolean;
  pom: boolean;
  meta: number;
  porcentaje_acciones_realizadas: string;
  finiquito_path: string | null;
  aclaraciones: string | null;
  justificacion: string | null;
}

type SortKeys =
  | "porcentaje_acciones_realizadas"
  | "cod"
  | "proyecto"
  | "institucion";
type SortOrder = "asc" | "desc";

export default function Tabla() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKeys;
    direction: SortOrder;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reportes/all");
        if (!res.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await res.json();
        setReportes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleOpenModal = (content: string | null, title: string) => {
    setModalContent(content || "");
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (key: SortKeys) => {
    let direction: SortOrder = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredReports = [...reportes]
    .filter(
      (reporte) =>
        reporte.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reporte.cod.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reporte.institucion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;

      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (sortConfig.key === "porcentaje_acciones_realizadas") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-700">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-800 p-8">
      <div className="max-w-full mx-auto bg-white p-8 rounded-lg shadow-md flex flex-col h-[60vh]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Tabla de Reportes Generados
          </h1>
          <input
            type="text"
            placeholder="Buscar por proyecto, COD, o institución..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="p-2 border border-gray-300 rounded-md"
          />
        </div>
        {sortedAndFilteredReports.length === 0 ? (
          <p className="text-center text-gray-600">
            No hay reportes que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("cod")}
                  >
                    COD
                    {sortConfig?.key === "cod" &&
                      (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[40%]"
                    onClick={() => handleSort("proyecto")}
                  >
                    Proyecto
                    {sortConfig?.key === "proyecto" &&
                      (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("institucion")}
                  >
                    Institución
                    {sortConfig?.key === "institucion" &&
                      (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PEI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cumplimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meta
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("porcentaje_acciones_realizadas")}
                  >
                    Porcentaje
                    {sortConfig?.key === "porcentaje_acciones_realizadas" &&
                      (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finiquito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aclaraciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Justificación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredReports.map((reporte, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.cod}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 w-[40vw] break-words">
                      {reporte.proyecto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.institucion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.medida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.eje}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {reporte.poa ? "✔️" : "❌"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {reporte.pei ? "✔️" : "❌"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {reporte.pom ? "✔️" : "❌"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {reporte.cumplimiento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.meta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(
                        reporte.porcentaje_acciones_realizadas
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.finiquito_path ? (
                        <a
                          href={reporte.finiquito_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden">
                      {(reporte.aclaraciones || "").length > 30 ? (
                        <button
                          onClick={() =>
                            handleOpenModal(reporte.aclaraciones, "Aclaración")
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Ver más
                        </button>
                      ) : (
                        <span>{reporte.aclaraciones}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden">
                      {(reporte.justificacion || "").length > 30 ? (
                        <button
                          onClick={() =>
                            handleOpenModal(
                              reporte.justificacion,
                              "Justificación"
                            )
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Ver más
                        </button>
                      ) : (
                        <span>{reporte.justificacion}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={modalContent}
        title={modalTitle}
      />
    </div>
  );
}
