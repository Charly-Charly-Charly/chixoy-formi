'use client';

import { useState, useEffect } from 'react';

interface Reporte {
  proyecto: string;
  institucion: string;
  medida: string;
  eje: string;
  cumplimiento: boolean;
  poa: boolean;
  pei: boolean;
  pom: boolean;
  meta: number;
  porcentaje_acciones_realizadas: number;
  finiquito_path: string | null;
}

export default function Tabla() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reportes/all');
        if (!res.ok) {
          throw new Error('Failed to fetch reports');
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-md overflow-x-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Tabla de Reportes Generados
        </h1>
        {reportes.length === 0 ? (
          <p className="text-center text-gray-600">No hay reportes para mostrar.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institución</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PEI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumplimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finiquito</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportes.map((reporte, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reporte.proyecto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reporte.institucion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reporte.medida}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reporte.eje}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {reporte.poa ? '✔️' : '❌'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {reporte.pei ? '✔️' : '❌'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {reporte.pom ? '✔️' : '❌'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {reporte.cumplimiento ? '✔️' : '❌'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reporte.meta}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reporte.porcentaje_acciones_realizadas}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reporte.finiquito_path ? (
                      <a href={reporte.finiquito_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Ver PDF
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}