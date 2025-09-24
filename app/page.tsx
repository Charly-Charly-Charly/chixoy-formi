'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';

interface Institucion {
  id: number;
  nombre: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  medida: string;
  eje: string;
  meta: number;
}

interface FormData {
  poa: boolean;
  pei: boolean;
  pom: boolean;
  cumplimiento: boolean;
  porcentaje_acciones_realizadas: number;
  finiquito: File | null;
}

export default function Home() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [selectedInstitucionId, setSelectedInstitucionId] = useState<string>('');
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [formData, setFormData] = useState<{ [key: number]: FormData }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // 1. Cargar las instituciones al inicio
  useEffect(() => {
    const fetchInstituciones = async () => {
      try {
        const res = await fetch('/api/instituciones');
        if (!res.ok) throw new Error('Failed to fetch institutions');
        const data = await res.json();
        setInstituciones(data);
      } catch (error) {
        console.error('Error fetching institutions:', error);
      }
    };
    fetchInstituciones();
  }, []);

  // 2. Cargar proyectos al cambiar de institución
  const handleInstitucionChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedInstitucionId(id);
    setProyectos([]); // Limpiar proyectos al cambiar
    setFormData({}); // Limpiar estado del formulario
    if (id) {
      try {
        const res = await fetch(`/api/proyectos?institucionId=${id}`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProyectos(data);
        // Inicializar el estado del formulario para cada proyecto
        const initialFormData = data.reduce((acc: any, proyecto: Proyecto) => {
          acc[proyecto.id] = {
            poa: false,
            pei: false,
            pom: false,
            cumplimiento: false,
            porcentaje_acciones_realizadas: 0,
            finiquito: null,
          };
          return acc;
        }, {});
        setFormData(initialFormData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    }
  };

  // 3. Manejar cambios en los campos del formulario
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    proyectoId: number,
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData((prevData) => ({
      ...prevData,
      [proyectoId]: {
        ...prevData[proyectoId],
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  // 4. Manejar la selección de archivos
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, proyectoId: number) => {
    const file = e.target.files?.[0] || null;
    setFormData((prevData) => ({
      ...prevData,
      [proyectoId]: {
        ...prevData[proyectoId],
        finiquito: file,
      },
    }));
  };

  // 5. Enviar el formulario completo
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      for (const proyectoIdStr in formData) {
        const proyectoId = parseInt(proyectoIdStr);
        const proyectoData = formData[proyectoId];
        const proyecto = proyectos.find((p) => p.id === proyectoId);
        
        if (!proyecto) continue;

        let finiquitoPath = null;
        if (proyectoData.finiquito) {
          // Subir el PDF primero
          const uploadData = new FormData();
          uploadData.append('finiquito', proyectoData.finiquito);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadData,
          });

          if (!uploadRes.ok) throw new Error('Failed to upload PDF');
          const uploadResult = await uploadRes.json();
          finiquitoPath = uploadResult.filePath;
        }

        // Enviar los datos del reporte a la base de datos
        const reportRes = await fetch('/api/reportes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proyectoId,
            cumplimiento: proyectoData.cumplimiento,
            poa: proyectoData.poa,
            pei: proyectoData.pei,
            pom: proyectoData.pom,
            porcentaje_acciones_realizadas: parseFloat(String(proyectoData.porcentaje_acciones_realizadas)),
            finiquito_path: finiquitoPath,
          }),
        });

        if (!reportRes.ok) throw new Error(`Failed to save report for project ${proyecto.nombre}`);
      }

      setMessage('Reportes generados con éxito!');
      // Redireccionar o limpiar el formulario
    } catch (error: any) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* ... (el resto del JSX que ya tenías) ... */}
      <main className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Reporte de Cumplimiento</h1>

        {/* Selector de Institución */}
        <div className="mb-8">
          <label htmlFor="institucion" className="block text-gray-700 font-bold mb-2">
            Selecciona tu Institución:
          </label>
          <select
            id="institucion"
            value={selectedInstitucionId}
            onChange={handleInstitucionChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecciona una institución --</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Formulario de Proyectos */}
        {proyectos.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Proyectos Asignados</h2>
            {proyectos.map((proyecto) => (
              <div
                key={proyecto.id}
                className="p-6 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{proyecto.nombre}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="font-semibold text-gray-600">Medida:</span> {proyecto.medida}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Eje:</span> {proyecto.eje}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Meta:</span> {proyecto.meta}
                  </div>
                </div>

                {/* Checks y entradas del formulario */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      id={`poa-${proyecto.id}`}
                      name="poa"
                      checked={formData[proyecto.id]?.poa || false}
                      onChange={(e) => handleFormChange(e, proyecto.id)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor={`poa-${proyecto.id}`} className="text-gray-700">
                      POA
                    </label>
                    <input
                      type="checkbox"
                      id={`pei-${proyecto.id}`}
                      name="pei"
                      checked={formData[proyecto.id]?.pei || false}
                      onChange={(e) => handleFormChange(e, proyecto.id)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor={`pei-${proyecto.id}`} className="text-gray-700">
                      PEI
                    </label>
                    <input
                      type="checkbox"
                      id={`pom-${proyecto.id}`}
                      name="pom"
                      checked={formData[proyecto.id]?.pom || false}
                      onChange={(e) => handleFormChange(e, proyecto.id)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label htmlFor={`pom-${proyecto.id}`} className="text-gray-700">
                      POM
                    </label>
                  </div>
                  <div>
                    <label htmlFor={`cumplimiento-${proyecto.id}`} className="block text-gray-700">
                      Cumplimiento de Acciones:
                    </label>
                    <select
                      id={`cumplimiento-${proyecto.id}`}
                      name="cumplimiento"
                      value={formData[proyecto.id]?.cumplimiento ? 'true' : 'false'}
                      onChange={(e) => handleFormChange(e, proyecto.id)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="false">No</option>
                      <option value="true">Sí</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`porcentaje-${proyecto.id}`} className="block text-gray-700">
                      Porcentaje de Acciones Realizadas:
                    </label>
                    <input
                      type="number"
                      id={`porcentaje-${proyecto.id}`}
                      name="porcentaje_acciones_realizadas"
                      value={formData[proyecto.id]?.porcentaje_acciones_realizadas || 0}
                      onChange={(e) => handleFormChange(e, proyecto.id)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor={`finiquito-${proyecto.id}`} className="block text-gray-700">
                      Finiquito (PDF):
                    </label>
                    <input
                      type="file"
                      id={`finiquito-${proyecto.id}`}
                      name="finiquito"
                      accept="application/pdf"
                      onChange={(e) => handleFileChange(e, proyecto.id)}
                      className="mt-1 w-full text-gray-700"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
            {message && (
              <p className="mt-4 text-center text-green-600 font-semibold">{message}</p>
            )}
          </form>
        )}
      </main>
      {/* ... (el resto del JSX) ... */}
    </div>
  );
}